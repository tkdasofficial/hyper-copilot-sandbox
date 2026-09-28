import { StudioLayout } from "@/layouts/StudioLayout";

const sections = [
  {
    h: "Data we collect",
    p: "Account details, prompts you submit, references you upload, and basic usage metrics such as credits consumed and models used.",
  },
  {
    h: "How we use it",
    p: "To generate your output, keep your history and library available, prevent abuse, and improve reliability of the platform.",
  },
  {
    h: "Model training",
    p: "Your prompts and uploads are not used to train public models. Private model fine-tuning happens only on assets you explicitly select.",
  },
  {
    h: "Retention",
    p: "Generations stay in your workspace until you delete them. Deleted assets are purged from backups within 30 days.",
  },
  {
    h: "Your controls",
    p: "You can export or delete your workspace data at any time from Settings, or request removal by contacting support.",
  },
];

export function PrivacyPage() {
  return (
    <StudioLayout maxWidth="max-w-2xl" showBackgroundTasks={false}>
      <div className="space-y-5">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-[15px] font-bold">{s.h}</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
    </StudioLayout>
  );
}

export default PrivacyPage;
