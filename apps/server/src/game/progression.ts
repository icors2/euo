interface CharacterRuntime {
  inventory: Array<{ slot: number; itemId: string; name: string; quantity: number }>;
  equipment: Record<string, { itemId: string; name: string } | null>;
  quests: Array<{ id: string; title: string; state: 'available' | 'active' | 'complete'; objective: string }>;
}

const state = new Map<string, CharacterRuntime>();

function ensure(characterId: string): CharacterRuntime {
  let runtime = state.get(characterId);
  if (!runtime) {
    runtime = {
      inventory: [
        { slot: 0, itemId: 'rustbound-blade', name: 'Rustbound Blade', quantity: 1 },
        { slot: 1, itemId: 'fen-salve', name: 'Fen Salve', quantity: 2 }
      ],
      equipment: {
        weapon: { itemId: 'rustbound-blade', name: 'Rustbound Blade' },
        chest: null,
        ring: null
      },
      quests: [
        { id: 'q-hearth-01', title: 'Ashes at the Gate', state: 'active', objective: 'Defeat 5 Ember Rats (0/5)' },
        { id: 'q-hearth-02', title: 'Lantern Oil Run', state: 'available', objective: 'Collect 3 Marsh Bulbs' }
      ]
    };
    state.set(characterId, runtime);
  }
  return runtime;
}

export function getInventory(characterId: string) {
  return ensure(characterId).inventory;
}

export function getEquipment(characterId: string) {
  return ensure(characterId).equipment;
}

export function equipItem(characterId: string, slot: string, invSlot: number): { ok: boolean; error?: string } {
  const runtime = ensure(characterId);
  const item = runtime.inventory.find((i) => i.slot === invSlot);
  if (!item) return { ok: false, error: 'Inventory slot is empty.' };
  runtime.equipment[slot] = { itemId: item.itemId, name: item.name };
  return { ok: true };
}

export function getQuestLog(characterId: string) {
  return ensure(characterId).quests;
}

export function getNpcDialogue(npcId: string) {
  const byNpc: Record<string, { name: string; lines: string[]; questOfferId?: string }> = {
    'npc-mira': {
      name: 'Mira Coalhand',
      lines: [
        'Welcome to Hearthmere, emberkin.',
        'If you seek work, the gate paths need clearing.'
      ],
      questOfferId: 'q-hearth-01'
    },
    'npc-ren': {
      name: 'Ren Drift',
      lines: [
        'Bramble March bites harder at dusk.',
        'Keep your lantern dry and your boots tighter.'
      ]
    }
  };
  return byNpc[npcId] ?? { name: 'Unknown', lines: ['...'] };
}
