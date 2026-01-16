import { RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { DoctorService } from './doctorService';
import { 
  CreateDoctorDto, 
  UpdateDoctorDto, 
  CreateDoctorProfileDto,
  CreateDoctorClinicDto,
  CreateDoctorReviewDto,
  CreateDoctorFAQDto
} from './types';

const doctorService = new DoctorService();

export class DoctorController {
  // Create a new doctor
  createDoctor: RequestHandler<{}, any, CreateDoctorDto> = async (req, res) => {
    try {
      const data = req.body;
      const doctor = await doctorService.createDoctor(data);
      res.status(201).json(doctor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create doctor' });
    }
  }

  // Get doctor by ID
  getDoctorById: RequestHandler<{ id: string }> = async (req, res) => {
    try {
      const { id } = req.params;
      const doctor = await doctorService.getDoctorById(id);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor not found' });
      } else {
        res.json(doctor);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get doctor' });
    }
  }

  // Update doctor
  updateDoctor: RequestHandler<{ id: string }, any, UpdateDoctorDto> = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const doctor = await doctorService.updateDoctor(id, data);
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update doctor' });
    }
  }

  // Create doctor profile
  createDoctorProfile: RequestHandler<{ doctorId: string }, any, CreateDoctorProfileDto> = async (req, res) => {
    try {
      const { doctorId } = req.params;
      const data = req.body;
      const profile = await doctorService.createDoctorProfile(doctorId, data);
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create doctor profile' });
    }
  }

  // Update doctor profile
  updateDoctorProfile: RequestHandler<{ doctorId: string }, any, Partial<CreateDoctorProfileDto>> = async (req, res) => {
    try {
      const { doctorId } = req.params;
      const data = req.body;
      const profile = await doctorService.updateDoctorProfile(doctorId, data);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update doctor profile' });
    }
  }

  // Add clinic
  addClinic: RequestHandler<{ doctorId: string }, any, CreateDoctorClinicDto> = async (req, res) => {
    try {
      const { doctorId } = req.params;
      const data = req.body;
      const clinic = await doctorService.addClinic(doctorId, data);
      res.status(201).json(clinic);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add clinic' });
    }
  }

  // Update clinic
  updateClinic: RequestHandler<{ clinicId: string }, any, Partial<CreateDoctorClinicDto>> = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const data = req.body;
      const clinic = await doctorService.updateClinic(clinicId, data);
      res.json(clinic);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update clinic' });
    }
  }

  // Delete clinic
  deleteClinic: RequestHandler<{ clinicId: string }> = async (req, res) => {
    try {
      const { clinicId } = req.params;
      await doctorService.deleteClinic(clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete clinic' });
    }
  }

  // Add review
  addReview: RequestHandler<{ doctorId: string }, any, CreateDoctorReviewDto> = async (req, res) => {
    try {
      const { doctorId } = req.params;
      const data = req.body;
      const review = await doctorService.addReview(doctorId, data);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add review' });
    }
  }

  // Add FAQ
  addFAQ: RequestHandler<{ doctorId: string }, any, CreateDoctorFAQDto> = async (req, res) => {
    try {
      const { doctorId } = req.params;
      const data = req.body;
      const faq = await doctorService.addFAQ(doctorId, data);
      res.status(201).json(faq);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add FAQ' });
    }
  }

  // Update FAQ
  updateFAQ: RequestHandler<{ faqId: string }, any, Partial<CreateDoctorFAQDto>> = async (req, res) => {
    try {
      const { faqId } = req.params;
      const data = req.body;
      const faq = await doctorService.updateFAQ(faqId, data);
      res.json(faq);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update FAQ' });
    }
  }

  // Delete FAQ
  deleteFAQ: RequestHandler<{ faqId: string }> = async (req, res) => {
    try {
      const { faqId } = req.params;
      await doctorService.deleteFAQ(faqId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete FAQ' });
    }
  }

  // Get all doctors
  getAllDoctors: RequestHandler<{}, any, any, { skip?: string; take?: string }> = async (req, res) => {
    try {
      const { skip = '0', take = '10' } = req.query;
      const doctors = await doctorService.getAllDoctors(
        Number(skip),
        Number(take)
      );
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get doctors' });
    }
  }

  // Search doctors
  searchDoctors: RequestHandler<{}, any, any, { query: string; skip?: string; take?: string }> = async (req, res) => {
    try {
      const { query, skip = '0', take = '10' } = req.query;
      if (!query) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }
      const doctors = await doctorService.searchDoctors(
        query,
        Number(skip),
        Number(take)
      );
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search doctors' });
    }
  }
} 