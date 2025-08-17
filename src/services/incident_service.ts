/**
 * Incident Service - Business logic for incident management
 * Handles CRUD operations, validation, and business rules for incidents
 */

import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { 
  incidentsNew, 
  symptoms,
  InsertIncidentNew, 
  IncidentNew, 
  InsertSymptom,
  Symptom 
} from '../../shared/schema.js';
import { Config } from '../core/config.js';
import { AuthenticatedUser } from '../core/rbac.js';

export interface CreateIncidentRequest extends InsertIncidentNew {
  // Additional validation or business logic fields if needed
}

export interface IncidentWithSymptoms extends IncidentNew {
  symptoms: Symptom[];
}

export interface IncidentSearchFilters {
  status?: string;
  priority?: string;
  reporterId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export class IncidentService {
  /**
   * Create a new incident (Step 1)
   */
  async createIncident(
    data: CreateIncidentRequest, 
    user: AuthenticatedUser
  ): Promise<IncidentNew> {
    // Validate required fields
    if (!data.title?.trim()) {
      throw new Error('Incident title is required');
    }
    
    if (!data.description?.trim()) {
      throw new Error('Incident description is required'); 
    }
    
    if (!data.priority || !['Low', 'Medium', 'High', 'Critical'].includes(data.priority)) {
      throw new Error('Valid priority is required (Low, Medium, High, Critical)');
    }
    
    // Set reporter ID from authenticated user
    const incidentData = {
      ...data,
      reporterId: user.id,
      status: 'open',
    };
    
    const [incident] = await db.insert(incidentsNew)
      .values(incidentData)
      .returning();
    
    console.log(`[INCIDENT_SERVICE] Created incident ${incident.id} by user ${user.id}`);
    
    return incident;
  }
  
  /**
   * Get incident by ID with access control
   */
  async getIncidentById(
    id: string, 
    user: AuthenticatedUser
  ): Promise<IncidentWithSymptoms | null> {
    let query = db.select().from(incidentsNew).where(eq(incidentsNew.id, id));
    
    // Reporters can only see incidents they created
    if (user.role === 'Reporter') {
      query = query.where(and(
        eq(incidentsNew.id, id),
        eq(incidentsNew.reporterId, user.id)
      ));
    }
    
    const [incident] = await query;
    
    if (!incident) {
      return null;
    }
    
    // Fetch associated symptoms
    const incidentSymptoms = await db.select()
      .from(symptoms)
      .where(eq(symptoms.incidentId, id))
      .orderBy(asc(symptoms.createdAt));
    
    return {
      ...incident,
      symptoms: incidentSymptoms,
    };
  }
  
  /**
   * Get incidents with filters and access control
   */
  async getIncidents(
    filters: IncidentSearchFilters,
    user: AuthenticatedUser
  ): Promise<{ incidents: IncidentNew[], total: number }> {
    let query = db.select().from(incidentsNew);
    
    // Apply role-based filtering
    if (user.role === 'Reporter') {
      query = query.where(eq(incidentsNew.reporterId, user.id));
    }
    
    // Apply additional filters
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(incidentsNew.status, filters.status));
    }
    
    if (filters.priority) {
      conditions.push(eq(incidentsNew.priority, filters.priority));
    }
    
    if (filters.reporterId && user.role !== 'Reporter') {
      conditions.push(eq(incidentsNew.reporterId, filters.reporterId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    
    const incidents = await query
      .orderBy(desc(incidentsNew.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalQuery = db.select().from(incidentsNew);
    if (user.role === 'Reporter') {
      totalQuery.where(eq(incidentsNew.reporterId, user.id));
    }
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    
    const totalResult = await totalQuery;
    
    return {
      incidents,
      total: totalResult.length,
    };
  }
  
  /**
   * Update incident
   */
  async updateIncident(
    id: string,
    data: Partial<InsertIncidentNew>,
    user: AuthenticatedUser
  ): Promise<IncidentNew> {
    // Check access permissions
    const existingIncident = await this.getIncidentById(id, user);
    if (!existingIncident) {
      throw new Error('Incident not found or access denied');
    }
    
    // Validate status transitions
    if (data.status) {
      const validStatuses = ['open', 'investigating', 'closed'];
      if (!validStatuses.includes(data.status)) {
        throw new Error('Invalid status. Must be: open, investigating, closed');
      }
    }
    
    const [updatedIncident] = await db.update(incidentsNew)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(incidentsNew.id, id))
      .returning();
    
    console.log(`[INCIDENT_SERVICE] Updated incident ${id} by user ${user.id}`);
    
    return updatedIncident;
  }
  
  /**
   * Add symptoms to incident (Step 8)
   */
  async addSymptom(
    incidentId: string,
    symptomData: InsertSymptom,
    user: AuthenticatedUser
  ): Promise<Symptom> {
    // Verify access to incident
    const incident = await this.getIncidentById(incidentId, user);
    if (!incident) {
      throw new Error('Incident not found or access denied');
    }
    
    if (!symptomData.text?.trim()) {
      throw new Error('Symptom text is required');
    }
    
    const symptom = {
      ...symptomData,
      incidentId,
    };
    
    const [createdSymptom] = await db.insert(symptoms)
      .values(symptom)
      .returning();
    
    console.log(`[INCIDENT_SERVICE] Added symptom to incident ${incidentId} by user ${user.id}`);
    
    return createdSymptom;
  }
  
  /**
   * Get incidents for workflow selection (Step 8)
   * Returns incidents that can be used to initiate workflows
   */
  async getIncidentsForWorkflow(
    user: AuthenticatedUser,
    searchQuery?: string
  ): Promise<IncidentNew[]> {
    let query = db.select().from(incidentsNew)
      .where(eq(incidentsNew.status, 'open'));
    
    // Only Analysts, Approvers, and Admins can access all incidents for workflows
    if (!['Analyst', 'Approver', 'Admin'].includes(user.role)) {
      throw new Error('Insufficient permissions to initiate workflows');
    }
    
    const incidents = await query
      .orderBy(desc(incidentsNew.createdAt))
      .limit(50);
    
    // Apply search filter if provided
    if (searchQuery?.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      return incidents.filter(incident => 
        incident.title.toLowerCase().includes(searchTerm) ||
        incident.description.toLowerCase().includes(searchTerm) ||
        incident.id.includes(searchTerm)
      );
    }
    
    return incidents;
  }
  
  /**
   * Generate incident reference ID (INC_XXXXXX format)
   */
  generateIncidentReference(incident: IncidentNew): string {
    // Extract last 6 characters of UUID and prefix with INC_
    const shortId = incident.id.replace(/-/g, '').slice(-6).toUpperCase();
    return `INC_${shortId}`;
  }
  
  /**
   * Get incident statistics for dashboard
   */
  async getIncidentStats(user: AuthenticatedUser): Promise<{
    total: number;
    open: number;
    investigating: number;
    closed: number;
    byPriority: { priority: string; count: number }[];
  }> {
    let baseQuery = db.select().from(incidentsNew);
    
    // Apply role-based filtering
    if (user.role === 'Reporter') {
      baseQuery = baseQuery.where(eq(incidentsNew.reporterId, user.id));
    }
    
    const allIncidents = await baseQuery;
    
    const stats = {
      total: allIncidents.length,
      open: allIncidents.filter(i => i.status === 'open').length,
      investigating: allIncidents.filter(i => i.status === 'investigating').length,
      closed: allIncidents.filter(i => i.status === 'closed').length,
      byPriority: [] as { priority: string; count: number }[],
    };
    
    // Calculate priority distribution
    const priorityCounts = allIncidents.reduce((acc, incident) => {
      acc[incident.priority] = (acc[incident.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    stats.byPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
    }));
    
    return stats;
  }
}

// Export singleton instance
export const incidentService = new IncidentService();