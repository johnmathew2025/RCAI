/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: nlp-analyzer.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 */
import natural from 'natural';
import nlp from 'compromise';
import { franc } from 'franc-min';
import { pool } from './db';

export class EvidenceLibraryNLPAnalyzer {
  private tokenizer: natural.WordTokenizer;
  private stemmer: typeof natural.PorterStemmer;
  private sentiment: typeof natural.SentimentAnalyzer;
  
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.sentiment = natural.SentimentAnalyzer;
  }

  // Extract question patterns from AI/Investigator Questions field
  async analyzeQuestionPatterns(): Promise<{
    questionTypes: Array<{type: string, examples: string[], frequency: number}>,
    keyTerms: Array<{term: string, frequency: number, context: string[]}>,
    equipmentSpecificPatterns: Array<{equipment: string, commonQuestions: string[]}>
  }> {
    const evidenceData = await pool.query(`
      SELECT equipment_group, equipment_type, subtype, ai_or_investigator_questions, 
             component_failure_mode, root_cause_logic
      FROM evidence_library 
      WHERE ai_or_investigator_questions IS NOT NULL
    `);

    const questionTypes: Map<string, {examples: string[], frequency: number}> = new Map();
    const keyTerms: Map<string, {frequency: number, context: string[]}> = new Map();
    const equipmentPatterns: Map<string, Set<string>> = new Map();

    for (const row of evidenceData.rows) {
      const questions = row.ai_or_investigator_questions;
      const equipment = `${row.equipment_group}-${row.equipment_type}`;
      
      // Parse questions using compromise NLP
      const doc = nlp(questions);
      
      // Extract question words and classify question types
      const questionSentences = doc.sentences().out('array');
      for (const sentence of questionSentences) {
        const questionType = this.classifyQuestionType(sentence);
        
        if (!questionTypes.has(questionType)) {
          questionTypes.set(questionType, {examples: [], frequency: 0});
        }
        questionTypes.get(questionType)!.examples.push(sentence);
        questionTypes.get(questionType)!.frequency++;

        // Extract technical terms
        const techTerms = this.extractTechnicalTerms(sentence);
        techTerms.forEach(term => {
          if (!keyTerms.has(term)) {
            keyTerms.set(term, {frequency: 0, context: []});
          }
          keyTerms.get(term)!.frequency++;
          keyTerms.get(term)!.context.push(equipment);
        });

        // Group by equipment
        if (!equipmentPatterns.has(equipment)) {
          equipmentPatterns.set(equipment, new Set());
        }
        equipmentPatterns.get(equipment)!.add(sentence);
      }
    }

    return {
      questionTypes: Array.from(questionTypes.entries()).map(([type, data]) => ({
        type, 
        examples: data.examples.slice(0, 3), // Top 3 examples
        frequency: data.frequency
      })).sort((a, b) => b.frequency - a.frequency),
      
      keyTerms: Array.from(keyTerms.entries()).map(([term, data]) => ({
        term,
        frequency: data.frequency,
        context: [...new Set(data.context)].slice(0, 5) // Unique contexts
      })).sort((a, b) => b.frequency - a.frequency).slice(0, 20),
      
      equipmentSpecificPatterns: Array.from(equipmentPatterns.entries()).map(([equipment, questions]) => ({
        equipment,
        commonQuestions: Array.from(questions).slice(0, 5)
      }))
    };
  }

  // Analyze Root Cause Logic patterns for reasoning structures
  async analyzeRootCauseLogic(): Promise<{
    commonPatterns: Array<{pattern: string, frequency: number, examples: string[]}>,
    causalWords: Array<{word: string, frequency: number}>,
    logicStructures: Array<{structure: string, description: string, frequency: number}>
  }> {
    const logicData = await pool.query(`
      SELECT equipment_group, equipment_type, root_cause_logic, component_failure_mode
      FROM evidence_library 
      WHERE root_cause_logic IS NOT NULL AND root_cause_logic != ''
    `);

    const patterns: Map<string, {frequency: number, examples: string[]}> = new Map();
    const causalWords: Map<string, number> = new Map();
    const structures: Map<string, {description: string, frequency: number}> = new Map();

    const causalTerms = ['root:', 'cause:', 'contrib:', 'ruled out:', 'because', 'due to', 'leads to', 'results in'];

    for (const row of logicData.rows) {
      const logic = row.root_cause_logic.toLowerCase();
      
      // Extract causal reasoning patterns
      const doc = nlp(logic);
      
      // Identify logic structures
      if (logic.includes('root:') && logic.includes('contrib:')) {
        this.updateStructureCount(structures, 'root-contrib', 'Root cause with contributing factors identified');
      }
      if (logic.includes('ruled out:')) {
        this.updateStructureCount(structures, 'elimination', 'Process of elimination reasoning');
      }
      if (logic.includes('because') || logic.includes('due to')) {
        this.updateStructureCount(structures, 'causal-chain', 'Direct causal chain reasoning');
      }

      // Extract common causal words
      causalTerms.forEach(term => {
        if (logic.includes(term)) {
          causalWords.set(term, (causalWords.get(term) || 0) + 1);
        }
      });

      // Extract reasoning patterns using regex
      const reasoningPatterns = [
        /root:\s*([^.]*)/gi,
        /contrib:\s*([^.]*)/gi,
        /ruled out:\s*([^.]*)/gi
      ];

      reasoningPatterns.forEach(regex => {
        const matches = logic.match(regex);
        if (matches) {
          matches.forEach((match: string) => {
            const pattern = match.replace(/root:|contrib:|ruled out:/gi, '').trim();
            if (pattern.length > 10) {
              const key = this.normalizePattern(pattern);
              if (!patterns.has(key)) {
                patterns.set(key, {frequency: 0, examples: []});
              }
              patterns.get(key)!.frequency++;
              patterns.get(key)!.examples.push(pattern);
            }
          });
        }
      });
    }

    return {
      commonPatterns: Array.from(patterns.entries())
        .map(([pattern, data]) => ({
          pattern,
          frequency: data.frequency,
          examples: data.examples.slice(0, 3)
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10),
        
      causalWords: Array.from(causalWords.entries())
        .map(([word, frequency]) => ({word, frequency}))
        .sort((a, b) => b.frequency - a.frequency),
        
      logicStructures: Array.from(structures.entries())
        .map(([structure, data]) => ({
          structure,
          description: data.description,
          frequency: data.frequency
        }))
        .sort((a, b) => b.frequency - a.frequency)
    };
  }

  // Generate contextual follow-up questions based on patterns
  async generateFollowUpQuestions(equipmentType: string, failureMode: string, existingEvidence: string[]): Promise<{
    suggestedQuestions: string[],
    evidenceGaps: string[],
    priority: 'high' | 'medium' | 'low'
  }> {
    // Get similar patterns from Evidence Library
    const similarCases = await pool.query(`
      SELECT ai_or_investigator_questions, required_trend_data_evidence, attachments_evidence_required,
             confidence_level, diagnostic_value, evidence_priority
      FROM evidence_library 
      WHERE equipment_type ILIKE $1 AND component_failure_mode ILIKE $2
      LIMIT 5
    `, [`%${equipmentType}%`, `%${failureMode}%`]);

    const questions: string[] = [];
    const gaps: string[] = [];
    let priority: 'high' | 'medium' | 'low' = 'medium';

    // Analyze existing evidence patterns
    for (const row of similarCases.rows) {
      if (row.ai_or_investigator_questions) {
        const doc = nlp(row.ai_or_investigator_questions);
        const extractedQuestions = doc.sentences().out('array');
        
        // Generate contextual follow-ups
        extractedQuestions.forEach((q: string) => {
          if (this.isRelevantQuestion(q, existingEvidence)) {
            questions.push(this.adaptQuestionToContext(q, equipmentType, failureMode));
          }
        });
      }

      // Identify evidence gaps
      if (row.required_trend_data_evidence) {
        const requiredEvidence = row.required_trend_data_evidence.split(',');
        requiredEvidence.forEach((evidence: string) => {
          if (!this.hasEvidence(evidence.trim(), existingEvidence)) {
            gaps.push(`Missing: ${evidence.trim()}`);
          }
        });
      }

      // Set priority based on intelligence fields
      if (row.confidence_level === 'High' && row.diagnostic_value === 'Critical') {
        priority = 'high';
      }
    }

    return {
      suggestedQuestions: Array.from(new Set(questions)).slice(0, 5),
      evidenceGaps: Array.from(new Set(gaps)).slice(0, 5),
      priority
    };
  }

  private classifyQuestionType(question: string): string {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('when') || lowerQ.includes('time')) return 'temporal';
    if (lowerQ.includes('what') || lowerQ.includes('which')) return 'identification';
    if (lowerQ.includes('how') || lowerQ.includes('why')) return 'causal';
    if (lowerQ.includes('where')) return 'location';
    if (lowerQ.includes('vibration') || lowerQ.includes('noise')) return 'condition-monitoring';
    if (lowerQ.includes('temperature') || lowerQ.includes('pressure')) return 'process-parameter';
    if (lowerQ.includes('leak') || lowerQ.includes('seal')) return 'integrity';
    
    return 'general';
  }

  private extractTechnicalTerms(sentence: string): string[] {
    const doc = nlp(sentence);
    const terms: string[] = [];
    
    // Extract nouns that might be technical terms
    const nouns = doc.nouns().out('array');
    const technicalPatterns = [
      /\b(vibration|temperature|pressure|flow|level|seal|bearing|pump|motor|valve)\b/gi,
      /\b(leak|crack|wear|corrosion|failure|alarm|trip|shutdown)\b/gi
    ];
    
    nouns.forEach((noun: string) => {
      technicalPatterns.forEach(pattern => {
        if (pattern.test(noun)) {
          terms.push(noun.toLowerCase());
        }
      });
    });
    
    return terms;
  }

  private updateStructureCount(structures: Map<string, {description: string, frequency: number}>, 
                              key: string, description: string) {
    if (!structures.has(key)) {
      structures.set(key, {description, frequency: 0});
    }
    structures.get(key)!.frequency++;
  }

  private normalizePattern(pattern: string): string {
    return pattern.toLowerCase()
                 .replace(/\b(pump|motor|valve|bearing|seal)\b/g, '[EQUIPMENT]')
                 .replace(/\b(temperature|pressure|vibration|flow)\b/g, '[PARAMETER]')
                 .trim();
  }

  private isRelevantQuestion(question: string, existingEvidence: string[]): boolean {
    const questionTerms = this.tokenizer.tokenize(question.toLowerCase()) || [];
    const evidenceTerms = existingEvidence.join(' ').toLowerCase();
    
    // Check if question addresses gaps in existing evidence
    return questionTerms.some(term => !evidenceTerms.includes(term) && term.length > 3);
  }

  private adaptQuestionToContext(question: string, equipmentType: string, failureMode: string): string {
    return question.replace(/equipment|component|item/gi, equipmentType)
                  .replace(/failure|problem|issue/gi, failureMode);
  }

  private hasEvidence(required: string, existing: string[]): boolean {
    const requiredTerms = required.toLowerCase().split(/\s+/);
    const existingText = existing.join(' ').toLowerCase();
    
    return requiredTerms.some(term => existingText.includes(term));
  }
}

export const nlpAnalyzer = new EvidenceLibraryNLPAnalyzer();