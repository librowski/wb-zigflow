import { NavButton } from '@synergycodes/overflow-ui';
import { Icon } from '@workflowbuilder/sdk';

import { useRunPanelStore } from './run-panel';

function handleToggle() {
  useRunPanelStore.setState((state) => ({ open: !state.open }));
}

export function RunButton() {
  return (
    <NavButton onClick={handleToggle} tooltip="Run on Temporal">
      <Icon name="PlayCircle" />
    </NavButton>
  );
}
