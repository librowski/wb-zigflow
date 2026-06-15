import type { TemplateModel } from '@workflowbuilder/sdk';

import { approvalFlow } from './approval-flow';
import { orderRoutingFlow } from './order-routing-flow';
import { repoPulseFlow } from './repo-pulse-flow';

export const zigflowTemplates: TemplateModel[] = [repoPulseFlow, approvalFlow, orderRoutingFlow];
