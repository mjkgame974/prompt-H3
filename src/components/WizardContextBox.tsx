import React from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "default" | "info" | "warning" | "tip";

interface WizardContextBoxProps {
  icon: LucideIcon;
  title: string;
  description: string | React.ReactNode;
  variant?: Variant;
}

const VARIANT_STYLES: Record<Variant, { wrapper: string; icon: string }> = {
  default: {
    wrapper: "bg-slate-900/80 border border-slate-800",
    icon: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  info: {
    wrapper: "bg-blue-950/30 border border-blue-800/50",
    icon: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
  warning: {
    wrapper: "bg-rose-950/20 border border-rose-800/80 ring-1 ring-rose-500/50",
    icon: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  },
  tip: {
    wrapper: "bg-blue-950/30 border border-blue-800/50",
    icon: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
};

/**
 * Big, breathable context box shown at the top of every wizard step.
 * Centralises the styling so all 9 steps feel consistent, and gives the
 * intro card more presence (bigger padding, larger icon, larger title)
 * so the step doesn't feel cramped against the top of the form.
 */
export const WizardContextBox: React.FC<WizardContextBoxProps> = ({
  icon: Icon,
  title,
  description,
  variant = "default",
}) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={`${styles.wrapper} rounded-2xl p-7 sm:p-8`}>
      <div className="flex items-start space-x-4">
        <div
          className={`p-3 ${styles.icon} rounded-xl shrink-0`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-100 text-lg leading-snug">
            {title}
          </h3>
          <div className="text-sm text-slate-400 mt-2 leading-relaxed">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};
