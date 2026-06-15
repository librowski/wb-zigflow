import { NavButton } from '@synergycodes/overflow-ui';
import { Icon, openModal } from '@workflowbuilder/sdk';

import { WorkflowSettings } from './workflow-settings';

function handleOpen() {
  openModal({
    title: 'Workflow Settings',
    content: <WorkflowSettings />,
    isCloseButtonVisible: true,
  });
}

export function WorkflowSettingsButton() {
  return (
    <NavButton onClick={handleOpen} tooltip="Workflow settings (document & input)">
      <Icon name="Gear" />
    </NavButton>
  );
}
