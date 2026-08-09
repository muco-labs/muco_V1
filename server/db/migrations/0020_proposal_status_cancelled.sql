-- Phase 4.8: withdrawn proposals
ALTER TYPE "proposal_status" ADD VALUE IF NOT EXISTS 'cancelled';
