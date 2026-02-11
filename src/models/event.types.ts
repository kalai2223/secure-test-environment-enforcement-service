export interface AssessmentEvent {
  eventId: string;
  attemptId: string;
  type: string;
  timestamp: number;
  questionId?: string;
  metadata?: Record<string, any>;
  event?: string;
}
