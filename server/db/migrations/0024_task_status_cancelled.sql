-- Phase 4.14: task cancelled status for delivery operations

ALTER TYPE "task_status" ADD VALUE IF NOT EXISTS 'cancelled';
