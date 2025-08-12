#!/usr/bin/env python3
"""
UNIVERSAL RCA AI EVIDENCE ANALYSIS & PARSING LOGIC
REAL DATA SCIENCE IMPLEMENTATION with Python/pandas/NumPy/Signal Processing
STRICT: NO HARDCODING — FULLY SCHEMA-DRIVEN (v2025-07-25)
"""

import pandas as pd
import numpy as np
import json
import sys
import re
import io
from scipy import signal, fft
from sklearn.preprocessing import StandardScaler
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import base64
from typing import Dict, List, Tuple, Any, Optional
import warnings
warnings.filterwarnings('ignore')

class UniversalEvidenceAnalyzer:
    """
    Real data science implementation for evidence file analysis
    NO HARDCODING - All patterns detected dynamically
    """
    
    def __init__(self):
        self.sampling_rate_patterns = [
            r'(\d+\.?\d*)\s*hz',
            r'sample.*rate.*?(\d+\.?\d*)',
            r'fs.*=.*?(\d+\.?\d*)',
            r'freq.*=.*?(\d+\.?\d*)'
        ]
        
        self.time_patterns = [
            r'time',
            r't\s*\[',
            r'timestamp',
            r'seconds',
            r'minutes',
            r'hours'
        ]
        
        self.frequency_patterns = [
            r'freq',
            r'f\s*\[',
            r'hz',
            r'cycles',
            r'cpm'
        ]
        
        self.amplitude_patterns = [
            r'amp',
            r'magnitude',
            r'rms',
            r'peak',
            r'velocity',
            r'acceleration',
            r'displacement',
            r'mm/s',
            r'g\s',
            r'µm'
        ]
    
    def analyze_evidence_file(self, file_content: str, filename: str, evidence_config: Dict) -> Dict:
        """
        STEP 4 – EVIDENCE FILE HANDLING & AI ANALYSIS
        Real parsing with pandas/NumPy/Signal Processing
        """
        try:
            print(f"[PYTHON ANALYZER] Starting real data science analysis for {filename}", file=sys.stderr)
            
            # Detect file type and parse accordingly
            if filename.lower().endswith(('.csv', '.txt')):
                return self._analyze_csv_text_file(file_content, filename, evidence_config)
            elif filename.lower().endswith(('.xlsx', '.xls')):
                return self._analyze_excel_file(file_content, filename, evidence_config)
            elif filename.lower().endswith('.json'):
                return self._analyze_json_file(file_content, filename, evidence_config)
            else:
                return self._analyze_unknown_format(file_content, filename, evidence_config)
                
        except Exception as e:
            return {
                'filename': filename,
                'evidenceType': evidence_config.get('evidenceCategory', 'Unknown'),
                'diagnosticValue': 'Low',
                'parsedResultSummary': f'Analysis failed: {str(e)}',
                'evidenceConfidenceImpact': 5,
                'aiRemarks': f'Python parsing error: {str(e)}',
                'status': 'Incomplete',
                'requiresUserClarification': True,
                'clarificationPrompt': 'File could not be analyzed. Please check format and content.'
            }
    
    def _analyze_csv_text_file(self, file_content: str, filename: str, evidence_config: Dict) -> Dict:
        """
        Real CSV/TXT parsing with pandas and signal processing
        Auto-detects columns, performs FFT, trend analysis
        """
        print(f"[PYTHON ANALYZER] Parsing CSV/TXT file with pandas", file=sys.stderr)
        
        try:
            # Try different delimiters
            delimiters = [',', '\t', ';', ' ', '|']
            df = None
            delimiter_used = None
            
            for delimiter in delimiters:
                try:
                    # Replace escaped newlines if they exist in command line args
                    clean_content = file_content.replace('\\n', '\n')
                    df = pd.read_csv(io.StringIO(clean_content), delimiter=delimiter, header=0)
                    if df.shape[1] > 1:  # Valid multi-column data
                        delimiter_used = delimiter
                        break
                except Exception as e:
                    print(f"[PYTHON DEBUG] Delimiter {repr(delimiter)} failed: {e}")
                    continue
            
            if df is None or df.empty:
                return self._handle_parsing_error(filename, evidence_config, "Cannot parse file as CSV/TXT")
            
            print(f"[PYTHON ANALYZER] Successfully parsed {df.shape[0]} rows, {df.shape[1]} columns", file=sys.stderr)
            
            # Auto-detect column types using real pattern matching
            column_analysis = self._analyze_columns(df)
            
            # Perform signal processing if time-series data detected
            signal_analysis = self._perform_signal_analysis(df, column_analysis)
            
            # Calculate diagnostic value based on data quality
            diagnostic_assessment = self._assess_diagnostic_value(df, column_analysis, signal_analysis)
            
            return {
                'filename': filename,
                'evidenceType': evidence_config.get('evidenceCategory', 'Time Series Data'),
                'diagnosticValue': diagnostic_assessment['diagnostic_value'],
                'parsedResultSummary': diagnostic_assessment['summary'],
                'evidenceConfidenceImpact': diagnostic_assessment['confidence_impact'],
                'aiRemarks': diagnostic_assessment['remarks'],
                'status': 'Available',
                'detectedColumns': list(df.columns),
                'extractedFeatures': self._build_enhanced_features(
                    df, 
                    column_analysis, 
                    signal_analysis, 
                    diagnostic_assessment,
                    evidence_config,
                    delimiter_used or 'unknown'
                )
            }
            
        except Exception as e:
            return self._handle_parsing_error(filename, evidence_config, f"Pandas parsing failed: {str(e)}")
    
    def _analyze_columns(self, df: pd.DataFrame) -> Dict:
        """
        Real column type detection using pattern matching
        NO HARDCODING - Dynamic pattern recognition
        """
        column_types = {}
        
        for col in df.columns:
            col_lower = str(col).lower()
            sample_data = df[col].dropna().head(10)
            
            # Pattern-based detection
            if any(re.search(pattern, col_lower, re.IGNORECASE) for pattern in self.time_patterns):
                column_types[col] = 'time'
            elif any(re.search(pattern, col_lower, re.IGNORECASE) for pattern in self.frequency_patterns):
                column_types[col] = 'frequency'
            elif any(re.search(pattern, col_lower, re.IGNORECASE) for pattern in self.amplitude_patterns):
                column_types[col] = 'amplitude'
            elif re.search(r'rpm|speed|rotation', col_lower, re.IGNORECASE):
                column_types[col] = 'speed'
            elif re.search(r'temp|°c|°f|celsius|fahrenheit', col_lower, re.IGNORECASE):
                column_types[col] = 'temperature'
            elif re.search(r'pressure|bar|psi|kpa|mpa', col_lower, re.IGNORECASE):
                column_types[col] = 'pressure'
            elif re.search(r'1x|2x|3x|harmonic', col_lower, re.IGNORECASE):
                column_types[col] = 'harmonic'
            else:
                # Analyze data content for numeric vs text
                try:
                    numeric_converted = pd.to_numeric(sample_data, errors='coerce')
                    numeric_count = int(numeric_converted.notna().sum())
                    if numeric_count > len(sample_data) * 0.8:
                        column_types[col] = 'numeric'
                    else:
                        column_types[col] = 'text'
                except:
                    column_types[col] = 'unknown'
        
        return column_types
    
    def _perform_signal_analysis(self, df: pd.DataFrame, column_analysis: Dict) -> Dict:
        """
        Real signal processing with SciPy
        FFT analysis, trend detection, feature extraction
        """
        signal_results = {}
        
        try:
            # Find time and amplitude columns
            time_cols = [col for col, type_info in column_analysis.items() if type_info == 'time']
            amp_cols = [col for col, type_info in column_analysis.items() if type_info == 'amplitude']
            
            if not amp_cols:
                # Try to find numeric columns that could be amplitude
                numeric_cols = [col for col, type_info in column_analysis.items() if type_info == 'numeric']
                if numeric_cols:
                    amp_cols = numeric_cols[:2]  # Take first 2 numeric columns
            
            if amp_cols:
                for amp_col in amp_cols:
                    try:
                        amplitude_series = pd.to_numeric(df[amp_col], errors='coerce')
                        amplitude_data = amplitude_series.dropna()
                        
                        if len(amplitude_data) > 10:
                            # Basic statistical analysis
                            stats = {
                                'mean': float(amplitude_data.mean()),
                                'std': float(amplitude_data.std()),
                                'max': float(amplitude_data.max()),
                                'min': float(amplitude_data.min()),
                                'rms': float(np.sqrt(np.mean(amplitude_data.values**2)))
                            }
                            
                            # FFT analysis if sufficient data points
                            if len(amplitude_data) >= 64:
                                fft_analysis = self._perform_fft_analysis(amplitude_data)
                                stats.update(fft_analysis)
                            
                            # Trend analysis
                            trend_analysis = self._analyze_trends(amplitude_data)
                            stats.update(trend_analysis)
                            
                            signal_results[amp_col] = stats
                            
                    except Exception as e:
                        signal_results[amp_col] = {'error': str(e)}
            
            return signal_results
            
        except Exception as e:
            return {'error': f'Signal analysis failed: {str(e)}'}
    
    def _perform_fft_analysis(self, data: pd.Series) -> Dict:
        """
        Real FFT analysis with NumPy/SciPy
        """
        try:
            # Perform FFT
            fft_result = np.fft.fft(data.values)
            freqs = np.fft.fftfreq(len(data))
            
            # Find dominant frequencies
            magnitude = np.abs(fft_result)
            dominant_indices = np.argsort(magnitude)[-5:]  # Top 5 frequencies
            
            dominant_freqs = []
            for idx in dominant_indices:
                if freqs[idx] > 0:  # Only positive frequencies
                    dominant_freqs.append({
                        'frequency': float(freqs[idx]),
                        'magnitude': float(magnitude[idx])
                    })
            
            return {
                'fft_dominant_frequencies': dominant_freqs,
                'fft_peak_magnitude': float(magnitude.max()),
                'fft_analysis_performed': True
            }
            
        except Exception as e:
            return {'fft_error': str(e)}
    
    def _analyze_trends(self, data: pd.Series) -> Dict:
        """
        Real trend analysis using statistical methods
        """
        try:
            # Linear trend
            x = np.arange(len(data))
            coeffs = np.polyfit(x, np.array(data.values), 1)
            trend_slope = coeffs[0]
            
            # Detect significant changes
            rolling_mean = data.rolling(window=min(10, len(data)//4)).mean()
            rolling_std = data.rolling(window=min(10, len(data)//4)).std()
            
            # Outlier detection
            outliers = []
            for i, (val, mean_val, std_val) in enumerate(zip(data, rolling_mean, rolling_std)):
                if pd.notna(mean_val) and pd.notna(std_val) and std_val > 0:
                    if abs(val - mean_val) > 2 * std_val:
                        outliers.append(i)
            
            return {
                'trend_slope': float(trend_slope),
                'trend_direction': 'increasing' if trend_slope > 0.01 else 'decreasing' if trend_slope < -0.01 else 'stable',
                'outlier_count': len(outliers),
                'outlier_percentage': (len(outliers) / len(data)) * 100
            }
            
        except Exception as e:
            return {'trend_error': str(e)}
    
    def _assess_diagnostic_value(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict) -> Dict:
        """
        Calculate diagnostic value based on data science analysis
        NO HARDCODING - Dynamic assessment
        """
        try:
            score = 0
            remarks = []
            
            # Data completeness score
            completeness = (df.count().sum() / (df.shape[0] * df.shape[1])) * 100
            score += min(completeness, 30)
            remarks.append(f"Data completeness: {completeness:.1f}%")
            
            # Column type diversity score
            unique_types = len(set(column_analysis.values()))
            if unique_types >= 3:
                score += 20
                remarks.append("Good column type diversity")
            elif unique_types >= 2:
                score += 10
                remarks.append("Moderate column type diversity")
            
            # Signal analysis bonus
            if signal_analysis and any('fft_analysis_performed' in analysis for analysis in signal_analysis.values() if isinstance(analysis, dict)):
                score += 25
                remarks.append("FFT analysis completed")
            
            # Trend analysis bonus
            trend_count = sum(1 for analysis in signal_analysis.values() if isinstance(analysis, dict) and 'trend_slope' in analysis)
            if trend_count > 0:
                score += 15
                remarks.append(f"Trend analysis on {trend_count} signals")
            
            # Data volume score
            if df.shape[0] > 1000:
                score += 10
                remarks.append("Large dataset (>1000 points)")
            elif df.shape[0] > 100:
                score += 5
                remarks.append("Medium dataset (>100 points)")
            
            # Determine diagnostic value
            if score >= 80:
                diagnostic_value = 'High'
                confidence_impact = min(score, 95)
            elif score >= 50:
                diagnostic_value = 'Medium'
                confidence_impact = min(score, 75)
            else:
                diagnostic_value = 'Low'
                confidence_impact = max(score, 20)
            
            # Generate summary
            summary = f"Dataset: {df.shape[0]} rows x {df.shape[1]} columns. " + " ".join(remarks[:3])
            
            return {
                'diagnostic_value': diagnostic_value,
                'confidence_impact': int(confidence_impact),
                'summary': summary,
                'remarks': " | ".join(remarks),
                'data_quality': {
                    'completeness_score': completeness,
                    'total_score': score,
                    'assessment_factors': remarks
                }
            }
            
        except Exception as e:
            return {
                'diagnostic_value': 'Low',
                'confidence_impact': 20,
                'summary': f'Assessment failed: {str(e)}',
                'remarks': 'Could not assess data quality',
                'data_quality': {'error': str(e)}
            }
    
    def _analyze_excel_file(self, file_content: str, filename: str, evidence_config: Dict) -> Dict:
        """
        Real Excel parsing with pandas
        """
        try:
            # Decode base64 content
            excel_data = base64.b64decode(file_content)
            df = pd.read_excel(io.BytesIO(excel_data), sheet_name=0)
            
            print(f"[PYTHON ANALYZER] Parsed Excel: {df.shape[0]} rows x {df.shape[1]} columns", file=sys.stderr)
            
            # Use same analysis as CSV
            column_analysis = self._analyze_columns(df)
            signal_analysis = self._perform_signal_analysis(df, column_analysis)
            diagnostic_assessment = self._assess_diagnostic_value(df, column_analysis, signal_analysis)
            
            return {
                'filename': filename,
                'evidenceType': evidence_config.get('evidenceCategory', 'Spreadsheet Data'),
                'diagnosticValue': diagnostic_assessment['diagnostic_value'],
                'parsedResultSummary': diagnostic_assessment['summary'],
                'evidenceConfidenceImpact': diagnostic_assessment['confidence_impact'],
                'aiRemarks': diagnostic_assessment['remarks'],
                'status': 'Available',
                'detectedColumns': list(df.columns),
                'extractedFeatures': self._build_enhanced_features(
                    df, 
                    column_analysis, 
                    signal_analysis, 
                    diagnostic_assessment,
                    evidence_config,
                    'Excel'
                )
            }
            
        except Exception as e:
            return self._handle_parsing_error(filename, evidence_config, f"Excel parsing failed: {str(e)}")
    
    def _build_enhanced_features(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict, 
                                diagnostic_assessment: Dict, evidence_config: Dict, delimiter_or_type: str) -> Dict:
        """
        UNIVERSAL_LLM_PROMPT_ENHANCEMENT IMPLEMENTATION
        Build evidence-type-specific enhanced features for rich LLM analysis
        DYNAMIC ADAPTATION - NO HARDCODING of evidence types or field structures
        """
        
        # Common fields for ALL evidence types
        enhanced_features = {
            'fileType': self._detect_evidence_type(column_analysis, evidence_config),
            'duration': self._calculate_duration(df, column_analysis),
            'samplingRate': self._estimate_sampling_rate(df, column_analysis),
            'keyIndicators': self._extract_key_indicators(df, column_analysis, signal_analysis),
            'diagnosticQuality': self._assess_diagnostic_quality(diagnostic_assessment, df, column_analysis),
            'anomalySummary': self._detect_anomalies(df, column_analysis, signal_analysis),
            
            # Base metadata
            'rowCount': len(df),
            'columnCount': len(df.columns),
            'columnTypes': column_analysis,
            'signalAnalysis': signal_analysis,
            'delimiter': delimiter_or_type,
            'dataQuality': diagnostic_assessment['data_quality']
        }
        
        # Evidence-specific enhancements based on detected patterns
        evidence_type = enhanced_features['fileType'].lower()
        
        if 'vibration' in evidence_type or 'waveform' in evidence_type:
            enhanced_features.update(self._build_vibration_features(df, column_analysis, signal_analysis))
        elif 'temperature' in evidence_type or 'thermal' in evidence_type:
            enhanced_features.update(self._build_temperature_features(df, column_analysis, signal_analysis))
        elif 'pressure' in evidence_type or 'process' in evidence_type:
            enhanced_features.update(self._build_process_features(df, column_analysis, signal_analysis))
        elif 'acoustic' in evidence_type or 'ultrasound' in evidence_type:
            enhanced_features.update(self._build_acoustic_features(df, column_analysis, signal_analysis))
        else:
            # Generic numeric analysis for unknown evidence types
            enhanced_features.update(self._build_generic_numeric_features(df, column_analysis, signal_analysis))
        
        return enhanced_features
    
    def _detect_evidence_type(self, column_analysis: Dict, evidence_config: Dict) -> str:
        """Dynamically detect evidence type from column patterns and config"""
        
        # Check evidence config first
        if evidence_config.get('evidenceCategory'):
            return evidence_config['evidenceCategory']
        
        # Pattern-based detection from columns
        column_types = list(column_analysis.values())
        column_names = [str(col).lower() for col in column_analysis.keys()]
        
        if any('vibration' in name or 'vib' in name for name in column_names):
            return 'Vibration'
        elif any('temp' in name or 'thermal' in name for name in column_names):
            return 'Temperature'
        elif any('pressure' in name or 'press' in name for name in column_names):
            return 'Pressure'
        elif 'frequency' in column_types and 'amplitude' in column_types:
            return 'Waveform'
        elif 'time' in column_types and len([t for t in column_types if t in ['numeric', 'amplitude']]) >= 1:
            return 'Time Series'
        else:
            return 'Process Data'
    
    def _calculate_duration(self, df: pd.DataFrame, column_analysis: Dict) -> str:
        """Calculate time duration from time columns"""
        time_cols = [col for col, col_type in column_analysis.items() if col_type == 'time']
        
        if time_cols:
            try:
                time_col = time_cols[0]
                time_series = pd.to_numeric(df[time_col], errors='coerce')
                time_data = time_series.dropna()
                if len(time_data) > 1:
                    duration = float(time_data.max() - time_data.min())
                    return f"{duration:.2f} seconds"
            except:
                pass
        
        return f"{len(df)} data points"
    
    def _estimate_sampling_rate(self, df: pd.DataFrame, column_analysis: Dict) -> str:
        """Estimate sampling rate from time column spacing"""
        time_cols = [col for col, col_type in column_analysis.items() if col_type == 'time']
        
        if time_cols:
            try:
                time_col = time_cols[0]
                time_series = pd.to_numeric(df[time_col], errors='coerce')
                time_data = time_series.dropna()
                if len(time_data) > 10:
                    time_diff = time_data.diff().dropna()
                    avg_interval = float(time_diff.mean())
                    if avg_interval > 0:
                        sampling_rate = 1.0 / avg_interval
                        return f"{sampling_rate:.1f} Hz"
            except:
                pass
        
        return "Unknown"
    
    def _extract_key_indicators(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict) -> Dict:
        """Extract key statistical indicators across all numeric columns"""
        indicators = {}
        
        numeric_cols = [col for col, col_type in column_analysis.items() 
                       if col_type in ['numeric', 'amplitude', 'temperature', 'pressure', 'speed']]
        
        for col in numeric_cols[:5]:  # Limit to first 5 numeric columns
            try:
                data_series = pd.to_numeric(df[col], errors='coerce')
                data = data_series.dropna()
                if len(data) > 0:
                    indicators[col] = {
                        'max': float(data.max()),
                        'min': float(data.min()),
                        'avg': float(data.mean()),
                        'std': float(data.std()) if len(data) > 1 else 0.0,
                        'trend': self._get_trend_direction(data)
                    }
            except:
                continue
        
        return indicators
    
    def _get_trend_direction(self, data: pd.Series) -> str:
        """Get trend direction for data series"""
        if len(data) < 10:
            return 'insufficient_data'
        
        try:
            x = np.arange(len(data))
            slope = np.polyfit(x, np.array(data.values), 1)[0]
            
            if slope > data.std() * 0.1:
                return 'increasing'
            elif slope < -data.std() * 0.1:
                return 'decreasing'
            else:
                return 'stable'
        except:
            return 'unknown'
    
    def _assess_diagnostic_quality(self, diagnostic_assessment: Dict, df: pd.DataFrame, column_analysis: Dict) -> Dict:
        """Assess overall diagnostic quality with specific flags"""
        quality = {
            'score': diagnostic_assessment.get('confidence_impact', 0),
            'level': diagnostic_assessment.get('diagnostic_value', 'Unknown'),
            'flags': []
        }
        
        # Add specific quality flags
        if len(df) < 50:
            quality['flags'].append('short_duration')
        if df.shape[1] < 3:
            quality['flags'].append('limited_channels')
        
        completeness = (df.count().sum() / (df.shape[0] * df.shape[1])) * 100
        if completeness < 90:
            quality['flags'].append('missing_data')
        
        return quality
    
    def _detect_anomalies(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict) -> List[str]:
        """Detect potential anomalies across all signals"""
        anomalies = []
        
        # Check for outliers in signal analysis
        for col, analysis in signal_analysis.items():
            if isinstance(analysis, dict):
                if 'outlier_percentage' in analysis and analysis['outlier_percentage'] > 5:
                    anomalies.append(f"High outlier rate in {col}: {analysis['outlier_percentage']:.1f}%")
                
                if 'rms' in analysis and 'std' in analysis:
                    if analysis['rms'] > analysis.get('mean', 0) + 3 * analysis.get('std', 0):
                        anomalies.append(f"Elevated RMS in {col}: {analysis['rms']:.2f}")
        
        return anomalies[:5]  # Limit to 5 most significant anomalies
    
    def _build_vibration_features(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict) -> Dict:
        """Build vibration-specific enhanced features"""
        vibration_features = {}
        
        # Find amplitude columns
        amp_cols = [col for col, col_type in column_analysis.items() if col_type in ['amplitude', 'numeric']]
        
        if amp_cols and signal_analysis:
            for col in amp_cols[:3]:  # Limit to first 3 amplitude channels
                if col in signal_analysis and isinstance(signal_analysis[col], dict):
                    analysis = signal_analysis[col]
                    
                    vibration_features[f'{col}_analysis'] = {
                        'rmsAmplitude': analysis.get('rms', 0),
                        'peakAmplitude': analysis.get('max', 0),
                        'dominantFrequencies': analysis.get('fft_dominant_frequencies', []),
                        'harmonicContent': self._detect_harmonics(analysis),
                        'broadbandNoiseLevel': analysis.get('std', 0),
                        'sensorInfo': self._extract_sensor_info(col)
                    }
        
        return vibration_features
    
    def _build_temperature_features(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict) -> Dict:
        """Build temperature-specific enhanced features"""
        temp_features = {}
        
        temp_cols = [col for col, col_type in column_analysis.items() if col_type in ['temperature', 'numeric']]
        
        if temp_cols:
            for col in temp_cols[:3]:
                try:
                    temp_data = pd.to_numeric(df[col], errors='coerce').dropna()
                    if len(temp_data) > 0:
                        temp_features[f'{col}_analysis'] = {
                            'maxTemp': float(temp_data.max()),
                            'tempRiseRate': self._calculate_rise_rate(temp_data),
                            'stabilityDuration': self._assess_stability(temp_data),
                            'comparisonBaseline': float(temp_data.mean())
                        }
                except:
                    continue
        
        return temp_features
    
    def _build_process_features(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict) -> Dict:
        """Build process/pressure-specific enhanced features"""
        process_features = {}
        
        process_cols = [col for col, col_type in column_analysis.items() 
                       if col_type in ['pressure', 'numeric', 'speed']]
        
        if process_cols:
            for col in process_cols[:3]:
                if col in signal_analysis and isinstance(signal_analysis[col], dict):
                    analysis = signal_analysis[col]
                    
                    process_features[f'{col}_analysis'] = {
                        'tagFluctuationSummary': analysis.get('std', 0),
                        'rateOfChange': analysis.get('trend_slope', 0),
                        'controllerOutputShift': abs(analysis.get('max', 0) - analysis.get('min', 0))
                    }
        
        return process_features
    
    def _build_acoustic_features(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict) -> Dict:
        """Build acoustic/ultrasound-specific enhanced features"""
        acoustic_features = {}
        
        # Look for frequency/amplitude patterns typical of acoustic data
        freq_cols = [col for col, col_type in column_analysis.items() if col_type == 'frequency']
        amp_cols = [col for col, col_type in column_analysis.items() if col_type in ['amplitude', 'numeric']]
        
        if amp_cols:
            for col in amp_cols[:2]:
                if col in signal_analysis and isinstance(signal_analysis[col], dict):
                    analysis = signal_analysis[col]
                    
                    acoustic_features[f'{col}_analysis'] = {
                        'decibelLevel': analysis.get('max', 0),
                        'frequencyBands': analysis.get('fft_dominant_frequencies', []),
                        'transientEvents': analysis.get('outlier_count', 0)
                    }
        
        return acoustic_features
    
    def _build_generic_numeric_features(self, df: pd.DataFrame, column_analysis: Dict, signal_analysis: Dict) -> Dict:
        """Build generic numeric features for unknown evidence types"""
        generic_features = {}
        
        numeric_cols = [col for col, col_type in column_analysis.items() if col_type == 'numeric']
        
        if numeric_cols:
            generic_features['numeric_analysis'] = {
                'channels_analyzed': len(numeric_cols),
                'statistical_summary': {
                    col: {
                        'range': float(df[col].max() - df[col].min()) if pd.api.types.is_numeric_dtype(df[col]) else 0,
                        'variability': float(df[col].std()) if pd.api.types.is_numeric_dtype(df[col]) else 0
                    }
                    for col in numeric_cols[:3]
                },
                'data_characteristics': self._characterize_data(df, numeric_cols)
            }
        
        return generic_features
    
    def _detect_harmonics(self, analysis: Dict) -> str:
        """Detect harmonic content in FFT analysis"""
        if 'fft_dominant_frequencies' in analysis:
            freqs = [f['frequency'] for f in analysis['fft_dominant_frequencies']]
            if len(freqs) >= 2:
                # Check for harmonic relationships
                base_freq = min(freqs)
                harmonics = [f for f in freqs if f > base_freq and abs(f % base_freq) < 0.1 * base_freq]
                return f"{len(harmonics)} harmonics detected" if harmonics else "No clear harmonics"
        return "Unknown"
    
    def _extract_sensor_info(self, col_name: str) -> Dict:
        """Extract sensor information from column name"""
        col_lower = str(col_name).lower()
        
        info = {'axis': 'unknown', 'location': 'unknown', 'calibration': 'unknown'}
        
        if any(axis in col_lower for axis in ['x', 'horizontal', 'radial']):
            info['axis'] = 'X/Horizontal'
        elif any(axis in col_lower for axis in ['y', 'vertical']):
            info['axis'] = 'Y/Vertical'
        elif any(axis in col_lower for axis in ['z', 'axial']):
            info['axis'] = 'Z/Axial'
        
        if any(loc in col_lower for loc in ['de', 'drive', 'motor']):
            info['location'] = 'Drive End'
        elif any(loc in col_lower for loc in ['nde', 'free', 'fan']):
            info['location'] = 'Non-Drive End'
        
        return info
    
    def _calculate_rise_rate(self, temp_data: pd.Series) -> float:
        """Calculate temperature rise rate"""
        if len(temp_data) < 2:
            return 0.0
        
        try:
            x = np.arange(len(temp_data))
            slope = np.polyfit(x, np.array(temp_data.values), 1)[0]
            return float(slope)
        except:
            return 0.0
    
    def _assess_stability(self, temp_data: pd.Series) -> str:
        """Assess temperature stability duration"""
        if len(temp_data) < 10:
            return "insufficient_data"
        
        try:
            # Calculate rolling standard deviation
            rolling_std = temp_data.rolling(window=10).std()
            stable_points = (rolling_std < temp_data.std() * 0.1).sum()
            stability_percentage = (stable_points / len(temp_data)) * 100
            
            if stability_percentage > 80:
                return "highly_stable"
            elif stability_percentage > 50:
                return "moderately_stable"
            else:
                return "unstable"
        except:
            return "unknown"
    
    def _characterize_data(self, df: pd.DataFrame, numeric_cols: List[str]) -> Dict:
        """Characterize generic numeric data"""
        characteristics = {}
        
        try:
            # Overall data characteristics
            total_variance = sum(df[col].var() for col in numeric_cols if pd.api.types.is_numeric_dtype(df[col]))
            characteristics['total_variance'] = float(total_variance)
            
            # Correlation analysis if multiple columns
            if len(numeric_cols) >= 2:
                corr_matrix = df[numeric_cols].corr()
                max_correlation = corr_matrix.abs().max().max()
                characteristics['max_cross_correlation'] = float(max_correlation)
            
            characteristics['data_density'] = len(df) / df.shape[1]
            
        except Exception as e:
            characteristics['error'] = str(e)
        
        return characteristics
    
    def _analyze_json_file(self, file_content: str, filename: str, evidence_config: Dict) -> Dict:
        """
        Real JSON parsing and analysis
        """
        try:
            data = json.loads(file_content)
            
            # Convert to DataFrame if possible
            if isinstance(data, list) and len(data) > 0:
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                df = pd.DataFrame([data])
            else:
                return self._handle_parsing_error(filename, evidence_config, "JSON structure not suitable for analysis")
            
            print(f"[PYTHON ANALYZER] Parsed JSON: {df.shape[0]} records x {df.shape[1]} fields", file=sys.stderr)
            
            column_analysis = self._analyze_columns(df)
            diagnostic_assessment = self._assess_diagnostic_value(df, column_analysis, {})
            
            return {
                'filename': filename,
                'evidenceType': evidence_config.get('evidenceCategory', 'JSON Data'),
                'diagnosticValue': diagnostic_assessment['diagnostic_value'],
                'parsedResultSummary': diagnostic_assessment['summary'],
                'evidenceConfidenceImpact': diagnostic_assessment['confidence_impact'],
                'aiRemarks': diagnostic_assessment['remarks'],
                'status': 'Available',
                'detectedColumns': list(df.columns),
                'extractedFeatures': {
                    'recordCount': len(df),
                    'fieldCount': len(df.columns),
                    'columnTypes': column_analysis,
                    'fileType': 'JSON',
                    'dataQuality': diagnostic_assessment['data_quality']
                }
            }
            
        except Exception as e:
            return self._handle_parsing_error(filename, evidence_config, f"JSON parsing failed: {str(e)}")
    
    def _analyze_unknown_format(self, file_content: str, filename: str, evidence_config: Dict) -> Dict:
        """
        Handle unknown file formats
        """
        return {
            'filename': filename,
            'evidenceType': evidence_config.get('evidenceCategory', 'Unknown'),
            'diagnosticValue': 'Low',
            'parsedResultSummary': f'Unknown file format: {filename.split(".")[-1] if "." in filename else "no extension"}',
            'evidenceConfidenceImpact': 10,
            'aiRemarks': 'File format not supported for data science analysis',
            'status': 'Incomplete',
            'requiresUserClarification': True,
            'clarificationPrompt': f'File format .{filename.split(".")[-1] if "." in filename else "unknown"} not supported. Please upload as CSV, TXT, XLSX, or JSON.'
        }
    
    def _handle_parsing_error(self, filename: str, evidence_config: Dict, error_msg: str) -> Dict:
        """
        Handle parsing errors consistently
        """
        return {
            'filename': filename,
            'evidenceType': evidence_config.get('evidenceCategory', 'Unknown'),
            'diagnosticValue': 'Low',
            'parsedResultSummary': f'Parsing failed: {error_msg}',
            'evidenceConfidenceImpact': 5,
            'aiRemarks': f'Python data science parsing error: {error_msg}',
            'status': 'Incomplete',
            'requiresUserClarification': True,
            'clarificationPrompt': 'File could not be parsed. Please check format or provide different file.'
        }

def main():
    """
    Command-line interface for evidence analysis
    """
    if len(sys.argv) != 4:
        print("Usage: python python-evidence-analyzer.py <file_path_or_content> <filename> <evidence_config_json>")
        sys.exit(1)
    
    file_path_or_content = sys.argv[1]
    filename = sys.argv[2]
    evidence_config = json.loads(sys.argv[3])
    
    # Check if first argument is a file path (for large files to avoid E2BIG error)
    import os
    if os.path.exists(file_path_or_content):
        # Use sys.stderr for debug messages to avoid JSON parsing conflicts
        print(f"[PYTHON ANALYZER] Reading file from path: {file_path_or_content}", file=sys.stderr)
        with open(file_path_or_content, 'r', encoding='utf-8') as f:
            file_content = f.read()
    else:
        # Fallback to direct content (for backward compatibility)
        file_content = file_path_or_content
    
    analyzer = UniversalEvidenceAnalyzer()
    result = analyzer.analyze_evidence_file(file_content, filename, evidence_config)
    
    # Output ONLY the JSON result to stdout for clean parsing
    print(json.dumps(result, indent=2, ensure_ascii=True))

if __name__ == "__main__":
    main()