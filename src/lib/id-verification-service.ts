/**
 * Automated ID Verification Service
 * Integration with Smile Identity API for KYC verification
 * https://docs.usesmileid.com/
 */

import axios from 'axios';

export interface IDVerificationRequest {
  userId: string;
  idNumber: string;
  idType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVERS_LICENSE';
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  country: string; // ISO 3166-1 alpha-2 code (e.g., 'ZA' for South Africa)
  selfieImage?: string; // Base64 encoded image
  idFrontImage?: string; // Base64 encoded image
  idBackImage?: string; // Base64 encoded image
}

export interface IDVerificationResponse {
  success: boolean;
  verificationId: string;
  status: 'VERIFIED' | 'FAILED' | 'PENDING' | 'REVIEW_REQUIRED';
  confidence: number; // 0-100
  matchScore?: number; // Selfie to ID match score
  details: {
    nameMatch: boolean;
    dobMatch: boolean;
    idNumberValid: boolean;
    faceMatch?: boolean;
    livenessCheck?: boolean;
    documentAuthentic?: boolean;
  };
  reasons?: string[];
  timestamp: string;
}

class IDVerificationService {
  private apiKey: string;
  private partnerId: string;
  private apiUrl: string;
  private environment: 'sandbox' | 'production';

  constructor() {
    this.apiKey = process.env.SMILE_IDENTITY_API_KEY || '';
    this.partnerId = process.env.SMILE_IDENTITY_PARTNER_ID || '';
    this.environment = (process.env.SMILE_IDENTITY_ENV as 'sandbox' | 'production') || 'sandbox';
    this.apiUrl = this.environment === 'production'
      ? 'https://api.smileidentity.com/v1'
      : 'https://testapi.smileidentity.com/v1';
  }

  /**
   * Verify ID document using Smile Identity
   */
  async verifyID(request: IDVerificationRequest): Promise<IDVerificationResponse> {
    try {
      // Validate required fields
      if (!this.apiKey || !this.partnerId) {
        console.warn('Smile Identity credentials not configured. Using mock verification.');
        return this.mockVerification(request);
      }

      // Prepare request payload
      const payload = {
        partner_id: this.partnerId,
        partner_params: {
          user_id: request.userId,
          job_id: `job_${Date.now()}`,
          job_type: 5, // Document verification
        },
        id_info: {
          id_number: request.idNumber,
          id_type: request.idType,
          first_name: request.firstName,
          last_name: request.lastName,
          dob: request.dateOfBirth,
          country: request.country,
        },
        images: [
          ...(request.selfieImage ? [{
            image_type_id: 2, // Selfie
            image: request.selfieImage,
          }] : []),
          ...(request.idFrontImage ? [{
            image_type_id: 3, // ID card front
            image: request.idFrontImage,
          }] : []),
          ...(request.idBackImage ? [{
            image_type_id: 7, // ID card back
            image: request.idBackImage,
          }] : []),
        ],
      };

      // Make API request
      const response = await axios.post(
        `${this.apiUrl}/submit_job`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'SmileIdentity-API-Key': this.apiKey,
          },
          timeout: 30000, // 30 seconds
        }
      );

      // Parse response
      const data = response.data;
      const result = data.ResultCode === '1'; // Success code
      const confidence = this.calculateConfidence(data);

      return {
        success: result,
        verificationId: data.JobID || `verify_${Date.now()}`,
        status: this.mapStatus(data.ResultCode, confidence),
        confidence,
        matchScore: data.ConfidenceValue || undefined,
        details: {
          nameMatch: data.PartnerParams?.name_match || false,
          dobMatch: data.PartnerParams?.dob_match || false,
          idNumberValid: data.PartnerParams?.id_number_match || false,
          faceMatch: data.PartnerParams?.face_match || undefined,
          livenessCheck: data.PartnerParams?.liveness || undefined,
          documentAuthentic: data.PartnerParams?.document_check || undefined,
        },
        reasons: data.ResultText ? [data.ResultText] : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('ID verification failed:', error);

      // Return error response
      return {
        success: false,
        verificationId: `error_${Date.now()}`,
        status: 'FAILED',
        confidence: 0,
        details: {
          nameMatch: false,
          dobMatch: false,
          idNumberValid: false,
        },
        reasons: [error.message || 'Verification service unavailable'],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get verification status by ID
   */
  async getVerificationStatus(verificationId: string): Promise<IDVerificationResponse | null> {
    try {
      if (!this.apiKey || !this.partnerId) {
        return null;
      }

      const response = await axios.get(
        `${this.apiUrl}/job_status`,
        {
          params: {
            partner_id: this.partnerId,
            job_id: verificationId,
          },
          headers: {
            'SmileIdentity-API-Key': this.apiKey,
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      const result = data.ResultCode === '1';
      const confidence = this.calculateConfidence(data);

      return {
        success: result,
        verificationId,
        status: this.mapStatus(data.ResultCode, confidence),
        confidence,
        matchScore: data.ConfidenceValue || undefined,
        details: {
          nameMatch: data.PartnerParams?.name_match || false,
          dobMatch: data.PartnerParams?.dob_match || false,
          idNumberValid: data.PartnerParams?.id_number_match || false,
          faceMatch: data.PartnerParams?.face_match || undefined,
          livenessCheck: data.PartnerParams?.liveness || undefined,
          documentAuthentic: data.PartnerParams?.document_check || undefined,
        },
        reasons: data.ResultText ? [data.ResultText] : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get verification status:', error);
      return null;
    }
  }

  /**
   * Mock verification for testing (when API keys not configured)
   */
  private mockVerification(request: IDVerificationRequest): IDVerificationResponse {
    // Simple mock logic: verify if ID number has at least 13 characters
    const isValid = request.idNumber.length >= 13;
    const confidence = isValid ? 95 : 30;

    return {
      success: isValid,
      verificationId: `mock_${Date.now()}`,
      status: isValid ? 'VERIFIED' : 'FAILED',
      confidence,
      matchScore: isValid ? 92 : 25,
      details: {
        nameMatch: isValid,
        dobMatch: isValid,
        idNumberValid: isValid,
        faceMatch: request.selfieImage ? isValid : undefined,
        livenessCheck: request.selfieImage ? isValid : undefined,
        documentAuthentic: isValid,
      },
      reasons: isValid ? undefined : ['Mock verification: ID number too short'],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(data: any): number {
    if (data.ConfidenceValue) {
      return Math.round(data.ConfidenceValue * 100);
    }

    // Calculate based on individual checks
    let score = 0;
    let checks = 0;

    if (data.PartnerParams?.name_match !== undefined) {
      score += data.PartnerParams.name_match ? 25 : 0;
      checks++;
    }
    if (data.PartnerParams?.dob_match !== undefined) {
      score += data.PartnerParams.dob_match ? 25 : 0;
      checks++;
    }
    if (data.PartnerParams?.id_number_match !== undefined) {
      score += data.PartnerParams.id_number_match ? 25 : 0;
      checks++;
    }
    if (data.PartnerParams?.face_match !== undefined) {
      score += data.PartnerParams.face_match ? 25 : 0;
      checks++;
    }

    return checks > 0 ? Math.round(score / checks * 4) : 50;
  }

  /**
   * Map result code to status
   */
  private mapStatus(resultCode: string, confidence: number): 'VERIFIED' | 'FAILED' | 'PENDING' | 'REVIEW_REQUIRED' {
    if (resultCode === '1' && confidence >= 80) return 'VERIFIED';
    if (resultCode === '1' && confidence >= 60) return 'REVIEW_REQUIRED';
    if (resultCode === '0') return 'PENDING';
    return 'FAILED';
  }

  /**
   * Validate South African ID number format and extract info
   */
  validateSouthAfricanID(idNumber: string): {
    valid: boolean;
    dateOfBirth?: string;
    gender?: 'M' | 'F';
    citizen?: boolean;
  } {
    // Remove spaces and validate length
    const cleanId = idNumber.replace(/\s/g, '');
    if (cleanId.length !== 13 || !/^\d{13}$/.test(cleanId)) {
      return { valid: false };
    }

    // Extract date of birth (YYMMDD)
    const year = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const day = parseInt(cleanId.substring(4, 6));

    // Determine century
    const currentYear = new Date().getFullYear() % 100;
    const fullYear = year <= currentYear ? 2000 + year : 1900 + year;

    // Validate date
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { valid: false };
    }

    const dob = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Extract gender (position 7-10)
    const genderDigits = parseInt(cleanId.substring(6, 10));
    const gender = genderDigits < 5000 ? 'F' : 'M';

    // Extract citizenship (position 11)
    const citizenshipDigit = parseInt(cleanId.substring(10, 11));
    const citizen = citizenshipDigit === 0;

    // Luhn algorithm check
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      let digit = parseInt(cleanId[i]);
      if (i % 2 === 0) {
        sum += digit;
      } else {
        digit *= 2;
        sum += digit > 9 ? digit - 9 : digit;
      }
    }

    const valid = sum % 10 === 0;

    return {
      valid,
      dateOfBirth: valid ? dob : undefined,
      gender: valid ? gender : undefined,
      citizen: valid ? citizen : undefined,
    };
  }
}

export const idVerificationService = new IDVerificationService();
