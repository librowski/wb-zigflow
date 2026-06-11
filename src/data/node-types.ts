import type { PaletteItemOrGroup } from '@workflowbuilder/sdk';

import { activityCallPaletteItem } from '../nodes/activity-call';
import { forkPaletteItem } from '../nodes/fork';
import { httpCallPaletteItem } from '../nodes/http-call';
import { joinPaletteItem } from '../nodes/join';
import { listenPaletteItem } from '../nodes/listen';
import { rawTaskPaletteItem } from '../nodes/raw';
import { setPaletteItem } from '../nodes/set';
import { switchPaletteItem } from '../nodes/switch';
import { triggerPaletteItem } from '../nodes/trigger';
import { waitPaletteItem } from '../nodes/wait';

export const zigflowNodeTypes: PaletteItemOrGroup[] = [
  {
    label: 'Zigflow',
    isOpen: true,
    groupItems: [
      triggerPaletteItem,
      setPaletteItem,
      httpCallPaletteItem,
      activityCallPaletteItem,
      waitPaletteItem,
      listenPaletteItem,
      switchPaletteItem,
      forkPaletteItem,
      joinPaletteItem,
      rawTaskPaletteItem,
    ],
  },
];
