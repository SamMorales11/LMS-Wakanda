CREATE TYPE "public"."attendance_method" AS ENUM('TOKEN', 'QR_SCAN', 'MANUAL_LECTURER');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('PRESENT', 'LATE', 'PERMIT', 'SICK', 'ABSENT');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('ENROLLED', 'DROPPED', 'COMPLETED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."grade_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."quiz_attempt_status" AS ENUM('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'TIMED_OUT');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('REGULAR', 'MIDTERM_EXAM', 'FINAL_EXAM', 'LABORATORY', 'QUIZ');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('SUBMITTED', 'GRADED', 'RESUBMISSION_REQUESTED');--> statement-breakpoint
CREATE TYPE "public"."term_semester" AS ENUM('ODD', 'EVEN', 'SHORT');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'lecturer', 'student');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"nim_nidn" varchar(50),
	"phone_number" varchar(30),
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"year" varchar(20) NOT NULL,
	"semester" "term_semester" DEFAULT 'ODD' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_lecturers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"lecturer_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"academic_term_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"capacity" integer DEFAULT 40 NOT NULL,
	"room" varchar(100),
	"schedule_day" varchar(20),
	"schedule_start" time,
	"schedule_end" time,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"credits" integer DEFAULT 3 NOT NULL,
	"semester" integer DEFAULT 1 NOT NULL,
	"description" text,
	"syllabus_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"degree" varchar(50) DEFAULT 'S1' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"session_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"topic_description" text,
	"session_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"session_type" "session_type" DEFAULT 'REGULAR' NOT NULL,
	"status" "session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'ENROLLED' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "attendance_status" DEFAULT 'PRESENT' NOT NULL,
	"check_in_time" timestamp with time zone DEFAULT now() NOT NULL,
	"check_in_method" "attendance_method" DEFAULT 'TOKEN' NOT NULL,
	"device_info" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"qr_code_payload" text,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"session_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"instructions" text,
	"max_score" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"allow_late_submission" boolean DEFAULT false NOT NULL,
	"late_penalty_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"score" numeric(5, 2),
	"status" "quiz_attempt_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"session_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"max_score" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"passing_score" numeric(5, 2) DEFAULT '70.00' NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"shuffle_questions" boolean DEFAULT true NOT NULL,
	"max_attempts" integer DEFAULT 1 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"file_url" text,
	"content_text" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_late" boolean DEFAULT false NOT NULL,
	"score" numeric(5, 2),
	"feedback" text,
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	"status" "submission_status" DEFAULT 'SUBMITTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "final_grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"attendance_score" numeric(5, 2) DEFAULT '0.00',
	"assignment_score" numeric(5, 2) DEFAULT '0.00',
	"quiz_score" numeric(5, 2) DEFAULT '0.00',
	"midterm_score" numeric(5, 2) DEFAULT '0.00',
	"final_exam_score" numeric(5, 2) DEFAULT '0.00',
	"total_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"letter_grade" varchar(5) DEFAULT 'E' NOT NULL,
	"grade_point" numeric(3, 2) DEFAULT '0.00' NOT NULL,
	"status" "grade_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"final_grade_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"previous_score" numeric(5, 2),
	"new_score" numeric(5, 2) NOT NULL,
	"previous_letter" varchar(5),
	"new_letter" varchar(5) NOT NULL,
	"reason" text NOT NULL,
	"ip_address" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"component_name" varchar(100) NOT NULL,
	"weight_percentage" numeric(5, 2) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_lecturers" ADD CONSTRAINT "class_lecturers_class_id_course_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."course_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_lecturers" ADD CONSTRAINT "class_lecturers_lecturer_id_users_id_fk" FOREIGN KEY ("lecturer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_classes" ADD CONSTRAINT "course_classes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_classes" ADD CONSTRAINT "course_classes_academic_term_id_academic_terms_id_fk" FOREIGN KEY ("academic_term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_course_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."course_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_class_id_course_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."course_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_tokens" ADD CONSTRAINT "attendance_tokens_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_tokens" ADD CONSTRAINT "attendance_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_course_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."course_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_class_id_course_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."course_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_grades" ADD CONSTRAINT "final_grades_class_id_course_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."course_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_grades" ADD CONSTRAINT "final_grades_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_grades" ADD CONSTRAINT "final_grades_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_audit_logs" ADD CONSTRAINT "grade_audit_logs_final_grade_id_final_grades_id_fk" FOREIGN KEY ("final_grade_id") REFERENCES "public"."final_grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_audit_logs" ADD CONSTRAINT "grade_audit_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_weights" ADD CONSTRAINT "grade_weights_class_id_course_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."course_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_nim_nidn_idx" ON "users" USING btree ("nim_nidn");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_terms_code_idx" ON "academic_terms" USING btree ("code");--> statement-breakpoint
CREATE INDEX "academic_terms_is_active_idx" ON "academic_terms" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "class_lecturers_class_lecturer_idx" ON "class_lecturers" USING btree ("class_id","lecturer_id");--> statement-breakpoint
CREATE INDEX "class_lecturers_class_id_idx" ON "class_lecturers" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "class_lecturers_lecturer_id_idx" ON "class_lecturers" USING btree ("lecturer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_classes_term_course_code_idx" ON "course_classes" USING btree ("academic_term_id","course_id","code");--> statement-breakpoint
CREATE INDEX "course_classes_course_id_idx" ON "course_classes" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_classes_term_id_idx" ON "course_classes" USING btree ("academic_term_id");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_program_code_idx" ON "courses" USING btree ("program_id","code");--> statement-breakpoint
CREATE INDEX "courses_program_id_idx" ON "courses" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "courses_code_idx" ON "courses" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_code_idx" ON "programs" USING btree ("code");--> statement-breakpoint
CREATE INDEX "programs_is_active_idx" ON "programs" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "class_sessions_class_session_num_idx" ON "class_sessions" USING btree ("class_id","session_number");--> statement-breakpoint
CREATE INDEX "class_sessions_class_id_idx" ON "class_sessions" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "class_sessions_date_idx" ON "class_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "class_sessions_status_idx" ON "class_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "class_enrollments_class_student_idx" ON "class_enrollments" USING btree ("class_id","student_id");--> statement-breakpoint
CREATE INDEX "class_enrollments_class_id_idx" ON "class_enrollments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "class_enrollments_student_id_idx" ON "class_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "class_enrollments_status_idx" ON "class_enrollments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_logs_session_student_idx" ON "attendance_logs" USING btree ("session_id","student_id");--> statement-breakpoint
CREATE INDEX "attendance_logs_session_id_idx" ON "attendance_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attendance_logs_student_id_idx" ON "attendance_logs" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "attendance_logs_status_idx" ON "attendance_logs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_tokens_token_idx" ON "attendance_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "attendance_tokens_session_id_idx" ON "attendance_tokens" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attendance_tokens_valid_range_idx" ON "attendance_tokens" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "assignments_class_id_idx" ON "assignments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "assignments_session_id_idx" ON "assignments" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "assignments_due_date_idx" ON "assignments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_student_idx" ON "quiz_attempts" USING btree ("quiz_id","student_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_student_id_idx" ON "quiz_attempts" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_status_idx" ON "quiz_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quizzes_class_id_idx" ON "quizzes" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "quizzes_session_id_idx" ON "quizzes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "quizzes_start_end_time_idx" ON "quizzes" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_assignment_student_idx" ON "submissions" USING btree ("assignment_id","student_id");--> statement-breakpoint
CREATE INDEX "submissions_assignment_id_idx" ON "submissions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "submissions_student_id_idx" ON "submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "final_grades_class_student_idx" ON "final_grades" USING btree ("class_id","student_id");--> statement-breakpoint
CREATE INDEX "final_grades_class_id_idx" ON "final_grades" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "final_grades_student_id_idx" ON "final_grades" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "final_grades_status_idx" ON "final_grades" USING btree ("status");--> statement-breakpoint
CREATE INDEX "grade_audit_logs_final_grade_id_idx" ON "grade_audit_logs" USING btree ("final_grade_id");--> statement-breakpoint
CREATE INDEX "grade_audit_logs_changed_by_idx" ON "grade_audit_logs" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "grade_audit_logs_created_at_idx" ON "grade_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "grade_weights_class_component_idx" ON "grade_weights" USING btree ("class_id","component_name");--> statement-breakpoint
CREATE INDEX "grade_weights_class_id_idx" ON "grade_weights" USING btree ("class_id");