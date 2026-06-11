import { NavButton } from '@synergycodes/overflow-ui';
import { Icon } from '@workflowbuilder/sdk';

import { useImportStore } from '../../stores/use-import-store';

function handleOpen() {
  useImportStore.setState({ open: true, error: null });
}

export function ImportZigflowButton() {
  return (
    <NavButton onClick={handleOpen} tooltip="Import Zigflow YAML">
      <Icon name="UploadSimple" />
    </NavButton>
  );
}
