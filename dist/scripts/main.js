// scripts/main.ts
import { world as world2 } from "@minecraft/server";

// scripts/keyyard/processor.ts
import {
  ItemDurabilityComponent,
  ItemStack,
  system
} from "@minecraft/server";

// scripts/keyyard/data.ts
var blockData = /* @__PURE__ */ new Map([
  // logs
  ["minecraft:oak_log", { level: 1, item: "minecraft:oak_log", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:spruce_log", { level: 1, item: "minecraft:spruce_log", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:birch_log", { level: 1, item: "minecraft:birch_log", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:jungle_log", { level: 1, item: "minecraft:jungle_log", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:acacia_log", { level: 1, item: "minecraft:acacia_log", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:dark_oak_log", { level: 1, item: "minecraft:dark_oak_log", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:mangrove_log", { level: 1, item: "minecraft:mangrove_log", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:cherry_log", { level: 1, item: "minecraft:cherry_log", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:crimson_stem", { level: 1, item: "minecraft:crimson_stem", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:warped_stem", { level: 1, item: "minecraft:warped_stem", itemPerLevel: 1, chance: 0.33 }],
  // ores
  ["minecraft:coal_ore", { level: 1, item: "minecraft:coal", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:deepslate_coal_ore", { level: 1, item: "minecraft:coal", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:copper_ore", { level: 1, item: "minecraft:raw_copper", itemPerLevel: 5, chance: 0.33 }],
  ["minecraft:deepslate_copper_ore", { level: 1, item: "minecraft:raw_copper", itemPerLevel: 5, chance: 0.33 }],
  ["minecraft:iron_ore", { level: 2, item: "minecraft:raw_iron", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:deepslate_iron_ore", { level: 2, item: "minecraft:raw_iron", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:gold_ore", { level: 3, item: "minecraft:raw_gold", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:deepslate_gold_ore", { level: 3, item: "minecraft:raw_gold", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:redstone_ore", { level: 2, item: "minecraft:redstone", itemPerLevel: 9, chance: 0.33 }],
  ["minecraft:deepslate_redstone_ore", { level: 2, item: "minecraft:redstone", itemPerLevel: 9, chance: 0.33 }],
  ["minecraft:lapis_ore", { level: 2, item: "minecraft:lapis_lazuli", itemPerLevel: 9, chance: 0.33 }],
  ["minecraft:deepslate_lapis_ore", { level: 2, item: "minecraft:lapis_lazuli", itemPerLevel: 9, chance: 0.33 }],
  ["minecraft:diamond_ore", { level: 3, item: "minecraft:diamond", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:deepslate_diamond_ore", { level: 3, item: "minecraft:diamond", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:emerald_ore", { level: 3, item: "minecraft:emerald", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:deepslate_emerald_ore", { level: 3, item: "minecraft:emerald", itemPerLevel: 1, chance: 0.33 }],
  ["minecraft:nether_gold_ore", { level: 2, item: "minecraft:gold_nugget", itemPerLevel: 6, chance: 0.33 }],
  ["minecraft:quartz_ore", { level: 2, item: "minecraft:quartz", itemPerLevel: 1, chance: 0.33 }]
]);

// scripts/keyyard/processor.ts
function breakBlock(block, fortuneLevel, hasSilkTouch) {
  const blockInfo = blockData.get(block.typeId);
  let dropCount = 1;
  if (!blockInfo)
    return;
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
function applyDurabilityDamage(player, item, inventory, slotIndex) {
  const durabilityComponent = item.getComponent(ItemDurabilityComponent.componentId);
  if (durabilityComponent) {
    const { unbreakingLevel } = getRelevantEnchantments(item);
    if (Math.random() < 1 / (unbreakingLevel + 1)) {
      durabilityComponent.damage += 1;
      if (durabilityComponent.damage >= durabilityComponent.maxDurability) {
        inventory.container.setItem(slotIndex, void 0);
        player.playSound("random.break");
      } else {
        inventory.container.setItem(slotIndex, item);
      }
    }
  }
}
function getRelevantEnchantments(item) {
  let unbreakingLevel = 0;
  let hasSilkTouch = false;
  let fortuneLevel = 0;
  const enchantableComponent = item.getComponent("minecraft:enchantable");
  if (enchantableComponent) {
    const enchantments = enchantableComponent.getEnchantments();
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
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
var BlockProcessor = class _BlockProcessor {
  static processBlock(player, block, item, isRecursive, blockData2, unbreakingLevel, fortuneLevel, hasSilkTouch) {
    const durabilityComponent = item.getComponent(ItemDurabilityComponent.componentId);
    let currentLevel = durabilityComponent.damage;
    const processedBlocks = /* @__PURE__ */ new Set();
    if (isRecursive && _BlockProcessor.shouldContinueProcessing(unbreakingLevel)) {
      let filterOtherBlock2 = function(other) {
        if (other && other.isValid() && other.permutation.matches(targetPerm.type.id) && !processedBlocks.has(other)) {
          array.push(other);
          processedBlocks.add(other);
        }
      };
      var filterOtherBlock = filterOtherBlock2;
      currentLevel++;
      if (currentLevel >= durabilityComponent.maxDurability) {
        return;
      } else {
        system.runTimeout(() => {
          const inventoryComp = player.getComponent("inventory");
          const inventory = inventoryComp.container;
          const selectedItem = inventory.getItem(player.selectedSlotIndex);
          if (selectedItem) {
            applyDurabilityDamage(player, selectedItem, inventory, player.selectedSlotIndex);
          }
        }, 1);
      }
      const targetPerm = block.permutation;
      const array = [block];
      function* process() {
        let element;
        do {
          element = array.shift();
          if (element) {
            const aboveBlock = element.above();
            if (aboveBlock)
              filterOtherBlock2(aboveBlock);
            const southBlock = element.south();
            if (southBlock)
              filterOtherBlock2(southBlock);
            const northBlock = element.north();
            if (northBlock)
              filterOtherBlock2(northBlock);
            const eastBlock = element.east();
            if (eastBlock)
              filterOtherBlock2(eastBlock);
            const westBlock = element.west();
            if (westBlock)
              filterOtherBlock2(westBlock);
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
  static isDenied(location, processedBlocks) {
    return processedBlocks.some(
      (processedBlock) => location.x === processedBlock.x && location.y === processedBlock.y && location.z === processedBlock.z
    );
  }
  static shouldContinueProcessing(unbreakingLevel) {
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
};
var TreeCapitator = class {
  static startChopping(player, block, item, isRecursive) {
    const durabilityComponent = item.getComponent(ItemDurabilityComponent.componentId);
    if (!durabilityComponent)
      return;
    const { unbreakingLevel, hasSilkTouch, fortuneLevel } = getRelevantEnchantments(item);
    const logData = blockData.get(block.typeId);
    if (!logData || this.getAxeLevel(item) < logData.level)
      return;
    BlockProcessor.processBlock(player, block, item, isRecursive, logData, unbreakingLevel, fortuneLevel, hasSilkTouch);
  }
  static getAxeLevel(item) {
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
};
var VeinMiner = class {
  static startMining(player, block, item, isRecursive) {
    const durabilityComponent = item.getComponent(ItemDurabilityComponent.componentId);
    if (!durabilityComponent)
      return;
    const { unbreakingLevel, fortuneLevel, hasSilkTouch } = getRelevantEnchantments(item);
    const oreData = blockData.get(block.typeId);
    if (!oreData || this.getPickaxeLevel(item) < oreData.level)
      return;
    BlockProcessor.processBlock(player, block, item, isRecursive, oreData, unbreakingLevel, fortuneLevel, hasSilkTouch);
  }
  static getPickaxeLevel(item) {
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
};

// scripts/keyyard/activation.ts
import { EquipmentSlot, EntityEquippableComponent } from "@minecraft/server";
var Activation = class {
  /**
   * Activates the tree capitator functionality.
   */
  treeCapitatorActivate(data) {
    const { block, dimension, itemStack, player } = data;
    if (!itemStack)
      return;
    const mainhand = player.getComponent(EntityEquippableComponent.componentId).getEquipmentSlot(EquipmentSlot.Mainhand);
    const item = mainhand.getItem();
    const splitId = item.typeId.split(":")[1].split("_")[1];
    if (!item)
      return;
    if (splitId == `axe`)
      TreeCapitator.startChopping(player, block, item, dimension);
  }
  /**
   * Activates the vein miner functionality.
   */
  veinMinerActivate(data) {
    const { block, dimension, itemStack, player } = data;
    if (!itemStack)
      return;
    const mainhand = player.getComponent(EntityEquippableComponent.componentId).getEquipmentSlot(EquipmentSlot.Mainhand);
    const item = mainhand.getItem();
    if (!item)
      return;
    const splitId = item.typeId.split(":")[1].split("_")[1];
    if (!item)
      return;
    if (splitId == `pickaxe`)
      VeinMiner.startMining(player, block, item, dimension);
  }
  /**
   * Activates the both functionality.
   */
  bothActivate(data) {
    const { block, dimension, itemStack, player } = data;
    if (!itemStack)
      return;
    const mainhand = player.getComponent(EntityEquippableComponent.componentId).getEquipmentSlot(EquipmentSlot.Mainhand);
    const item = mainhand.getItem();
    if (!item)
      return;
    TreeCapitator.startChopping(player, block, item, dimension);
    VeinMiner.startMining(player, block, item, dimension);
  }
};

// scripts/optionMenu.ts
import { ModalFormData } from "@minecraft/server-ui";
var OptionMenu = class {
  optionMenu(player) {
    const treeActive = player.hasTag("TreeActive");
    const veinActive = player.hasTag("VeinActive");
    const optionForm = new ModalFormData().title("Tree Captivator & Vein Miner Options").toggle("Tree Captivator", treeActive).toggle("Vein Miner", veinActive);
    optionForm.show(player).then((formData) => {
      if (formData.formValues === void 0)
        return;
      const [treeSelected, veinSelected] = formData.formValues.map((value) => Boolean(value));
      this.updateTags(player, "TreeActive", "TreeInactive", treeSelected);
      this.updateTags(player, "VeinActive", "VeinInactive", veinSelected);
    });
  }
  updateTags(player, activeTag, inactiveTag, isActive) {
    if (isActive) {
      player.addTag(activeTag);
      player.removeTag(inactiveTag);
    } else {
      player.removeTag(activeTag);
      player.addTag(inactiveTag);
    }
  }
};

// scripts/utils.ts
import { system as system3 } from "@minecraft/server";
var MessageTemplates = class {
  static {
    this.FIRST_JOIN_MESSAGES = [
      "<Keyyard> Hey there! You have successfully applied Tree Capitator and Vein Miner addon to your world.",
      "<Keyyard> To use Tree Capitator, hold an axe and break the bottom block of a tree while sneaking.",
      "<Keyyard> To use Vein Miner, hold a pickaxe and break a block while sneaking.",
      `<Keyyard> You can use the "Option Controller" item to activate or deactivate these features.`,
      "<Keyyard> There will be more features coming soon!",
      "<Keyyard> Follow us on \xA7cYou\xA7fTube\xA7r Keyyard, \xA7bTwitter\xA7r @Keyyard, \xA7cYou\xA7fTube\xA7r Beyond64",
      "<Keyyard> Join our community discord server: \xA7bhttps://discord.gg/s2VfQr69uz , \xA7bhttps://discord.gg/cdZA3bccQk",
      "<Keyyard> Have fun playing!"
    ];
  }
  static {
    this.RETURNING_PLAYER_MESSAGES = [
      "<Keyyard> Follow us on \xA7cYou\xA7fTube\xA7r Keyyard, \xA7bTwitter\xA7r @Keyyard, \xA7cYou\xA7fTube\xA7r Beyond64",
      "<Keyyard> Join our community discord server: \xA7bhttps://discord.gg/s2VfQr69uz , \xA7bhttps://discord.gg/cdZA3bccQk",
      "<Keyyard> Have fun playing!"
    ];
  }
};
var PlayerStateManager = class {
  static {
    this.FIRST_JOIN_TAG = "tcvm_first_joined";
  }
  static isFirstTimePlayer(player) {
    return !player.hasTag(this.FIRST_JOIN_TAG);
  }
  static markAsJoined(player) {
    if (!player.hasTag(this.FIRST_JOIN_TAG)) {
      player.addTag(this.FIRST_JOIN_TAG);
    }
  }
};
var NotificationSystem = class {
  static {
    this.BASE_DELAY = 100;
  }
  static {
    this.MESSAGE_INTERVAL = 150;
  }
  static {
    this.NOTIFICATION_SOUND = "random.orb";
  }
  static sendDelayedMessages(player, messages) {
    messages.forEach((message, index) => {
      const delay = this.BASE_DELAY + index * this.MESSAGE_INTERVAL;
      system3.runTimeout(() => {
        this.sendNotificationWithSound(player, message);
      }, delay);
    });
  }
  static sendNotificationWithSound(player, message) {
    player.sendMessage(message);
    player.dimension.playSound(this.NOTIFICATION_SOUND, player.location);
  }
};
var PlayerJoinHandler = class {
  static handlePlayerJoin(player) {
    const isFirstTime = PlayerStateManager.isFirstTimePlayer(player);
    if (isFirstTime) {
      this.handleFirstTimeJoin(player);
    } else {
      this.handleReturningPlayerJoin(player);
    }
  }
  static handleFirstTimeJoin(player) {
    NotificationSystem.sendDelayedMessages(player, MessageTemplates.FIRST_JOIN_MESSAGES);
    PlayerStateManager.markAsJoined(player);
  }
  static handleReturningPlayerJoin(player) {
    NotificationSystem.sendDelayedMessages(player, MessageTemplates.RETURNING_PLAYER_MESSAGES);
  }
};
function onFirstJoin(player) {
  PlayerJoinHandler.handlePlayerJoin(player);
}

// scripts/main.ts
world2.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
  const Option = new OptionMenu();
  if (itemStack.typeId == `keyyard:option_controller`) {
    Option.optionMenu(source);
  }
});
world2.beforeEvents.playerBreakBlock.subscribe(({ block, dimension, itemStack, player }) => {
  const activation = new Activation();
  if (player.isSneaking && player.getTags().includes(`TreeActive`))
    activation.treeCapitatorActivate({ block, dimension, itemStack, player });
  if (player.isSneaking && player.getTags().includes(`VeinActive`))
    activation.veinMinerActivate({ block, dimension, itemStack, player });
});
world2.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn)
    onFirstJoin(player);
  const Tags = ["TreeActive", "VeinActive", "TreeInactive", "VeinInactive"];
  if (!player.getTags().some((tag) => Tags.includes(tag))) {
    player.addTag("TreeActive");
    player.addTag("VeinActive");
  }
});

//# sourceMappingURL=../debug/main.js.map
