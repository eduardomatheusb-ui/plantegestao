import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/reembolsos/constants";
import type { ReembolsoStatus } from "@prisma/client";

export function ReembolsoStatusBadge({ status }: { status: ReembolsoStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
