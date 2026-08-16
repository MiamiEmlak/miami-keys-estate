import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  captureLead,
  flushLeadQueue,
  queuedLeadCount,
  type EspoLeadCapturePayload,
} from "@/services/espoCrm";

export type EspoLeadStatus = "idle" | "submitting" | "success" | "error";

type Options = {
  /** Retry any queued leads once on mount. Defaults to true. */
  retryOnMount?: boolean;
  successMessage?: string;
};

/**
 * Submits leads to the EspoCRM LeadCapture endpoint with toast feedback and
 * localStorage retry queuing when the CRM is unreachable.
 */
export function useEspoLead(options: Options = {}) {
  const { retryOnMount = true, successMessage = "Thanks — an advisor will reach out shortly." } =
    options;
  const [status, setStatus] = useState<EspoLeadStatus>("idle");
  const [queued, setQueued] = useState(0);

  const retryQueued = useCallback(async () => {
    const { sent, pending } = await flushLeadQueue();
    setQueued(pending);
    return { sent, pending };
  }, []);

  useEffect(() => {
    setQueued(queuedLeadCount());
    if (retryOnMount) void retryQueued();
  }, [retryOnMount, retryQueued]);

  const submit = useCallback(
    async (payload: EspoLeadCapturePayload) => {
      setStatus("submitting");
      const toastId = toast.loading("Sending your request…");
      const result = await captureLead(payload);
      if (result.ok) {
        setStatus("success");
        toast.success(successMessage, { id: toastId });
        void retryQueued();
      } else {
        setStatus("error");
        setQueued(queuedLeadCount());
        toast.error(`${result.error} We saved it and will retry automatically.`, { id: toastId });
      }
      return result;
    },
    [retryQueued, successMessage],
  );

  return {
    submit,
    retryQueued,
    status,
    queuedCount: queued,
    isSubmitting: status === "submitting",
    reset: () => setStatus("idle"),
  };
}