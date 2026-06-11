import type { TemplateModel } from '@workflowbuilder/sdk';

import { approvalFlow } from './approval-flow';
import { orderRoutingFlow } from './order-routing-flow';

export const zigflowTemplates: TemplateModel[] = [approvalFlow, orderRoutingFlow];
