-- Job.tipo deixa de ser enum (JOB/POSTAGEM) e passa a texto livre (catálogo no código).
ALTER TABLE "Job" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "Job" ALTER COLUMN "tipo" TYPE TEXT USING (
  CASE "tipo"::text WHEN 'POSTAGEM' THEN 'post_estatico' ELSE 'outro' END
);
ALTER TABLE "Job" ALTER COLUMN "tipo" SET DEFAULT 'outro';
DROP TYPE "JobTipo";
