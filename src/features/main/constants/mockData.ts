// src/features/main/constants/mockData.ts
// D39: the multilingual fixture cases this file used to export (`getMockCases` and the
// `mockCases*` arrays behind it) were removed here. `getMockCases` had no consumers, and every one of
// those 16 records was shaped to the legacy intake `Case` - a model 4(a) is retiring - so the block kept
// the dead shape alive in a live file, where a per-file field count read as a migration constraint.
// What remains is the one export something actually imports.

export const mockNpsData = [
    { name: 'Promoters', value: 65, fill: '#4ade80' },
    { name: 'Passives', value: 25, fill: '#facc15' },
    { name: 'Detractors', value: 10, fill: '#f87171' },
];
