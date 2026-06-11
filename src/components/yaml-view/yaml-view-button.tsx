import { NavButton } from '@synergycodes/overflow-ui';
import { Icon } from '@workflowbuilder/sdk';

import { useYamlViewStore } from '../../stores/use-yaml-view-store';

function handleToggle() {
  useYamlViewStore.setState((state) => ({ open: !state.open }));
}

export function YamlViewButton() {
  return (
    <NavButton onClick={handleToggle} tooltip="Zigflow YAML (live view)">
      <Icon name="Export" />
    </NavButton>
  );
}
