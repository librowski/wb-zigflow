import { NavButton } from '@synergycodes/overflow-ui';
import { Icon, useStore } from '@workflowbuilder/sdk';

import { serializeToZigflowYaml } from '../../serializer/to-zigflow';
import { useExportStore } from '../../stores/use-export-store';

function handleExport() {
  const { nodes, edges } = useStore.getState();

  try {
    const yaml = serializeToZigflowYaml(nodes, edges);
    useExportStore.setState({ yaml, error: null, open: true });
  } catch (error) {
    useExportStore.setState({
      yaml: null,
      error: error instanceof Error ? error.message : String(error),
      open: true,
    });
  }
}

export function ExportZigflowButton() {
  return (
    <NavButton onClick={handleExport} tooltip="Export Zigflow YAML">
      <Icon name="Export" />
    </NavButton>
  );
}
