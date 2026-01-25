CREATE TABLE "course_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" uuid NOT NULL,
	"template_id" text NOT NULL,
	"custom_template_text" text,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_variables" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" uuid NOT NULL,
	"variable_id" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"deployment_id" text NOT NULL,
	"template_id" text NOT NULL,
	"custom_template_text" text,
	"is_enabled" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_variables" (
	"id" text PRIMARY KEY NOT NULL,
	"deployment_id" text NOT NULL,
	"variable_id" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt_type" text NOT NULL,
	"deployment_id" text,
	"course_id" uuid,
	"section_id" uuid,
	"learner_id" uuid,
	"resolved_prompt" text NOT NULL,
	"ai_service" text,
	"execution_context" text,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_variables" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" uuid NOT NULL,
	"variable_id" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_prompts" ADD CONSTRAINT "course_prompts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prompts" ADD CONSTRAINT "course_prompts_template_id_prompt_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_variables" ADD CONSTRAINT "course_variables_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_variables" ADD CONSTRAINT "course_variables_variable_id_prompt_variables_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."prompt_variables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_prompts" ADD CONSTRAINT "deployment_prompts_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_prompts" ADD CONSTRAINT "deployment_prompts_template_id_prompt_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_variables" ADD CONSTRAINT "deployment_variables_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_variables" ADD CONSTRAINT "deployment_variables_variable_id_prompt_variables_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."prompt_variables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_executions" ADD CONSTRAINT "prompt_executions_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_executions" ADD CONSTRAINT "prompt_executions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_executions" ADD CONSTRAINT "prompt_executions_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_executions" ADD CONSTRAINT "prompt_executions_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_variables" ADD CONSTRAINT "section_variables_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_variables" ADD CONSTRAINT "section_variables_variable_id_prompt_variables_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."prompt_variables"("id") ON DELETE cascade ON UPDATE no action;