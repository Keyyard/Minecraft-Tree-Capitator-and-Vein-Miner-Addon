import {
  Block,
  Container,
  Enchantment,
  EntityInventoryComponent,
  ItemDurabilityComponent,
  ItemEnchantableComponent,
  ItemStack,
  Player,
  system,
  Vector3,
} from "@minecraft/server";
import { blockData } from "./data";

function breakBlock(block: Block, fortuneLevel: number, hasSilkTouch: boolean) {
  const blockInfo = blockData.get(block.typeId);
  let dropCount = 1;
  if (!blockInfo) return;
  if (hasSilkTouch) {
    const itemStack = new ItemStack(block.typeId, 1);
    block.dimension.spawnItem(itemStack, block.location);
  } else {
    dropCount = fortuneLevel > 0 ? randomNum(0, fortuneLevel) + 1 : 1;
    for (let i = 0; i < dropCount; i++) {
      const itemStack = new ItemStack(blockInfo.item, blockInfo.itemPerLevel);
      block.dimension.spawnItem(itemStack, block.location);
    }
  }
  block.setType("minecraft:air");
}

function applyDurabilityDamage(player: Player, item: ItemStack, inventory: any, slotIndex: number) {
  const durabilityComponent = item.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;
  if (durabilityComponent) {
    const { unbreakingLevel } = getRelevantEnchantments(item);
    if (Math.random() < 1 / (unbreakingLevel + 1)) {
      durabilityComponent.damage += 1;
      if (durabilityComponent.damage >= durabilityComponent.maxDurability) {
        inventory.container.setItem(slotIndex, undefined);
        player.playSound("random.break");
      } else {
        inventory.container.setItem(slotIndex, item);
      }
    }
  }
}

function getRelevantEnchantments(item: ItemStack) {
  let unbreakingLevel = 0;
  let hasSilkTouch = false;
  let fortuneLevel = 0;
  const enchantableComponent = item.getComponent("minecraft:enchantable") as ItemEnchantableComponent;
  if (enchantableComponent) {
    const enchantments = enchantableComponent.getEnchantments() as Enchantment[];
    for (const enchant of enchantments) {
      switch (enchant.type.id) {
        case "unbreaking":
          unbreakingLevel = enchant.level;
          break;
        case "silk_touch":
          hasSilkTouch = true;
          break;
        case "fortune":
          fortuneLevel = enchant.level;
          break;
      }
    }
  }
  return { unbreakingLevel, hasSilkTouch, fortuneLevel };
}

function randomNum(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

class BlockProcessor {
  static processBlock(
    player: Player,
    block: Block,
    item: ItemStack,
    isRecursive: boolean,
    blockData: { level: number; item: string; itemPerLevel: number; chance: number },
    unbreakingLevel: number,
    fortuneLevel: number,
    hasSilkTouch: boolean
  ) {
    const durabilityComponent = item.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;
    let currentLevel = durabilityComponent.damage;
    const processedBlocks = new Set();

    if (isRecursive && BlockProcessor.shouldContinueProcessing(unbreakingLevel)) {
      currentLevel++;
      if (currentLevel >= durabilityComponent.maxDurability) {
        return;
      } else {
        system.runTimeout(() => {
          const inventoryComp = player.getComponent("inventory") as EntityInventoryComponent;
          const inventory = inventoryComp.container as Container;
          const selectedItem = inventory.getItem(player.selectedSlotIndex);
          if (selectedItem) {
            applyDurabilityDamage(player, selectedItem, inventory, player.selectedSlotIndex);
          }
        }, 1);
      }
      const targetPerm = block.permutation;
      const array = [block];

      function filterOtherBlock(other: Block) {
        if (other && other.isValid() && other.permutation.matches(targetPerm.type.id) && !processedBlocks.has(other)) {
          array.push(other);
          processedBlocks.add(other);
        }
      }

      function* process() {
        let element;
        do {
          element = array.shift();
          if (element) {
            const aboveBlock = element.above();
            if (aboveBlock) filterOtherBlock(aboveBlock);

            const southBlock = element.south();
            if (southBlock) filterOtherBlock(southBlock);

            const northBlock = element.north();
            if (northBlock) filterOtherBlock(northBlock);

            const eastBlock = element.east();
            if (eastBlock) filterOtherBlock(eastBlock);

            const westBlock = element.west();
            if (westBlock) filterOtherBlock(westBlock);
          }
          if (element) {
            const elementItemStack = element.getItemStack(1, true);
            if (elementItemStack) {
              breakBlock(element, fortuneLevel, hasSilkTouch);
            }
          }
          yield;
        } while (array.length > 0);
      }

      processedBlocks.add(block);
      system.runJob(process());
    }
  }

  static isDenied(location: Vector3, processedBlocks: Block[]) {
    return processedBlocks.some(
      (processedBlock: { x: number; y: number; z: number }) =>
        location.x === processedBlock.x && location.y === processedBlock.y && location.z === processedBlock.z
    );
  }

  static shouldContinueProcessing(unbreakingLevel: number) {
    const randomValue = randomNum(0, 100);
    switch (unbreakingLevel) {
      case 1:
        return randomValue > 20;
      case 2:
        return randomValue > 33.3;
      case 3:
        return randomValue > 50;
      default:
        return true;
    }
  }
}

export class TreeCapitator {
  static startChopping(player: Player, block: Block, item: ItemStack, isRecursive: boolean) {
    const durabilityComponent = item.getComponent(ItemDurabilityComponent.componentId);
    if (!durabilityComponent) return;

    const { unbreakingLevel, hasSilkTouch, fortuneLevel } = getRelevantEnchantments(item);
    const logData = blockData.get(block.typeId);
    if (!logData || this.getAxeLevel(item) < logData.level) return;

    BlockProcessor.processBlock(player, block, item, isRecursive, logData, unbreakingLevel, fortuneLevel, hasSilkTouch);
  }

  static getAxeLevel(item: ItemStack) {
    switch (item.typeId) {
      case "minecraft:wooden_axe":
      case "minecraft:stone_axe":
        return 1;
      case "minecraft:iron_axe":
        return 3;
      case "minecraft:diamond_axe":
        return 4;
      case "minecraft:netherite_axe":
        return 5;
      default:
        return 5;
    }
  }
}

export class VeinMiner {
  static startMining(player: Player, block: Block, item: ItemStack, isRecursive: boolean) {
    const durabilityComponent = item.getComponent(ItemDurabilityComponent.componentId);
    if (!durabilityComponent) return;

    const { unbreakingLevel, fortuneLevel, hasSilkTouch } = getRelevantEnchantments(item);
    const oreData = blockData.get(block.typeId);
    if (!oreData || this.getPickaxeLevel(item) < oreData.level) return;

    BlockProcessor.processBlock(player, block, item, isRecursive, oreData, unbreakingLevel, fortuneLevel, hasSilkTouch);
  }

  static getPickaxeLevel(item: ItemStack) {
    switch (item.typeId) {
      case "minecraft:wooden_pickaxe":
      case "minecraft:stone_pickaxe":
        return 1;
      case "minecraft:iron_pickaxe":
        return 3;
      case "minecraft:diamond_pickaxe":
        return 4;
      case "minecraft:netherite_pickaxe":
        return 5;
      default:
        return 5;
    }
  }
}
