import { system, ItemStack, ItemDurabilityComponent, GameMode, ItemEnchantableComponent } from '@minecraft/server';

function applyDurabilityDamage(player, item, inventory, slotIndex) {
    const durabilityComponent = item.getComponent("minecraft:durability");
    if (durabilityComponent) {
        const { unbreakingLevel } = getRelevantEnchantments(item);

        if (Math.random() < 1 / (unbreakingLevel + 1)) {
            const newDamage = durabilityComponent.damage + 1;
            if (newDamage >= durabilityComponent.maxDurability) {
                inventory.container.setItem(slotIndex, undefined);
                player.playSound("random.break");
            } else {
                durabilityComponent.damage = newDamage;
                inventory.container.setItem(slotIndex, item);
            }
        }
    }
}

function getRelevantEnchantments(item) {
    let unbreakingLevel = 0;
    let hasSilkTouch = false;

    try {
        const enchantableComponent = item.getComponent("minecraft:enchantable");
        if (enchantableComponent) {
            const enchantments = enchantableComponent.getEnchantments();
            for (const enchant of enchantments) {
                if (enchant.type.id === "unbreaking") {
                    unbreakingLevel = enchant.level;
                } else if (enchant.type.id === "silk_touch") {
                    hasSilkTouch = true;
                }
            }
        }
    } catch (error) {
        console.warn("Error checking enchantments:", error);
    }
    return { unbreakingLevel, hasSilkTouch };
}

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export class TreeCapitator {
    static startChopping(player, block, item, isRecursive) {
        const durabilityComponent = item.getComponent("minecraft:durability");
        if (!durabilityComponent) return;

        const enchantableComponent = item.getComponent(ItemEnchantableComponent.componentId);
        let unbreakingLevel = undefined;

        if (enchantableComponent) {
            if (enchantableComponent.hasEnchantment('silk_touch')) return;
            if (enchantableComponent.hasEnchantment('unbreaking')) {
                unbreakingLevel = enchantableComponent.getEnchantment('unbreaking').level;
            }
        }

        const logData = this.logData.find(log => log.id == block.typeId);
        if (!logData) return;

        if (this.getAxeLevel(item) < logData.level) return;

        this.processBlock(player, block, item, isRecursive, durabilityComponent, logData, unbreakingLevel);
    }

    static getAxeLevel(item) {
        let axeLevel = 5;
        switch (item.typeId) {
            case 'minecraft:wooden_axe':
            case 'minecraft:stone_axe':
                axeLevel = 1;
                break;
            case 'minecraft:iron_axe':
                axeLevel = 3;
                break;
            case 'minecraft:diamond_axe':
                axeLevel = 4;
                break;
            case 'minecraft:netherite_axe':
                axeLevel = 5;
                break;
        }
        return axeLevel;
    }

    static processBlock(player, block, item, isRecursive, durabilityComponent, logData, unbreakingLevel) {
        let currentLevel = durabilityComponent.damage, blocksProcessed = 0, stopProcessing = false;
        const processedBlocks = [];

        function processAdjacentBlocks(currentBlock, isRecursive, isInitial) {
            processedBlocks.push(currentBlock.location);
            if (blocksProcessed >= TreeCapitator.limit) return;
            if (stopProcessing) return;

            const blockTypeId = currentBlock.typeId;
            let northBlock, southBlock, eastBlock, westBlock, aboveBlock, belowBlock;
            let northAboveBlock, southAboveBlock, eastAboveBlock, westAboveBlock;
            let northEastBlock, northWestBlock, southEastBlock, southWestBlock;
            let northEastAboveBlock, northWestAboveBlock, southEastAboveBlock, southWestAboveBlock;

            try { northBlock = currentBlock.north(1); } catch { }
            try { southBlock = currentBlock.south(1); } catch { }
            try { eastBlock = currentBlock.east(1); } catch { }
            try { westBlock = currentBlock.west(1); } catch { }
            try { aboveBlock = currentBlock.above(1); } catch { }
            try { belowBlock = currentBlock.below(1); } catch { }

            try { northAboveBlock = currentBlock.north(1).above(1); } catch { }
            try { southAboveBlock = currentBlock.south(1).above(1); } catch { }
            try { eastAboveBlock = currentBlock.east(1).above(1); } catch { }
            try { westAboveBlock = currentBlock.west(1).above(1); } catch { }

            try { northEastBlock = currentBlock.north(1).east(1); } catch { }
            try { northWestBlock = currentBlock.north(1).west(1); } catch { }
            try { southEastBlock = currentBlock.south(1).east(1); } catch { }
            try { southWestBlock = currentBlock.south(1).west(1); } catch { }

            try { northEastAboveBlock = currentBlock.north(1).east(1).above(1); } catch { }
            try { northWestAboveBlock = currentBlock.north(1).west(1).above(1); } catch { }
            try { southEastAboveBlock = currentBlock.south(1).east(1).above(1); } catch { }
            try { southWestAboveBlock = currentBlock.south(1).west(1).above(1); } catch { }

            const adjacentBlocks = [
                northBlock, southBlock, eastBlock, westBlock, aboveBlock, belowBlock,
                northAboveBlock, southAboveBlock, eastAboveBlock, westAboveBlock,
                northEastBlock, northWestBlock, southEastBlock, southWestBlock,
                northEastAboveBlock, northWestAboveBlock, southEastAboveBlock, southWestAboveBlock
            ]

            TreeCapitator.breakBlock(currentBlock);

            if (isRecursive && TreeCapitator.shouldContinueProcessing(unbreakingLevel)) {
                currentLevel++;
                if (currentLevel == durabilityComponent.maxDurability) {
                    stopProcessing = true;
                    system.runTimeout(() => {
                        player.dimension.runCommand(`tp ${player.location.x} ${player.location.y} ${player.location.z}`);
                    });
                    return;
                } else {
                    system.runTimeout(() => {
                        const inventory = player.getComponent("inventory");
                        const selectedItem = inventory.container.getItem(player.selectedSlotIndex);
                        if (selectedItem) {
                            applyDurabilityDamage(player, selectedItem, inventory, player.selectedSlotIndex);
                        }
                    }, 1);
                }
            }

            for (const adjacentBlock of adjacentBlocks) {
                if (adjacentBlock != undefined) {
                    const adjacentLocation = adjacentBlock.location;
                    if (adjacentBlock.typeId == blockTypeId && !TreeCapitator.isDenied(adjacentLocation, processedBlocks)) {
                        blocksProcessed++;
                        if (player.getGameMode() != GameMode.creative) {
                            processAdjacentBlocks(adjacentBlock, true, false);
                        } else {
                            processAdjacentBlocks(adjacentBlock, false, false);
                        }
                    }
                }
            }
        }

        processAdjacentBlocks(block, false, true);
    }

    static isDenied(location, processedBlocks) {
        let isDenied = false;
        for (const processedBlock of processedBlocks) {
            if (location.x == processedBlock.x && location.y == processedBlock.y && location.z == processedBlock.z) {
                isDenied = true;
            }
        }
        return isDenied;
    }

    static breakBlock(block) {
        const { x, y, z } = block.location;
        system.runTimeout(() => {
            block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} air [] destroy`);
        });
    }

    static shouldContinueProcessing(unbreakingLevel) {
        let shouldContinue = true;
        const randomValue = randomNum(0, 100);
        if (unbreakingLevel == undefined) return shouldContinue;
        switch (unbreakingLevel) {
            case 1:
                if (randomValue <= 20) shouldContinue = false;
                break;
            case 2:
                if (randomValue <= 33.3) shouldContinue = false;
                break;
            case 3:
                if (randomValue <= 50) shouldContinue = false;
                break;
        }
        return shouldContinue;
    }
}

TreeCapitator.logIDs = [
    'minecraft:oak_log', 'minecraft:spruce_log', 'minecraft:birch_log', 'minecraft:jungle_log',
    'minecraft:acacia_log', 'minecraft:dark_oak_log', 'minecraft:mangrove_log', 'minecraft:crimson_stem',
    'minecraft:warped_stem'
];

TreeCapitator.logData = [
    { id: 'minecraft:oak_log', level: 1, item: 'minecraft:oak_log', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:spruce_log', level: 1, item: 'minecraft:spruce_log', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:birch_log', level: 1, item: 'minecraft:birch_log', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:jungle_log', level: 1, item: 'minecraft:jungle_log', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:acacia_log', level: 1, item: 'minecraft:acacia_log', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:dark_oak_log', level: 1, item: 'minecraft:dark_oak_log', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:mangrove_log', level: 1, item: 'minecraft:mangrove_log', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:crimson_stem', level: 1, item: 'minecraft:crimson_stem', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:warped_stem', level: 1, item: 'minecraft:warped_stem', itemPerLevel: 1, chance: 0.33 }
];

TreeCapitator.limit = 84;

export class VeinMiner {
    static startMining(player, block, item, isRecursive) {
        const durabilityComponent = item.getComponent("minecraft:durability");
        if (!durabilityComponent) return;

        const enchantableComponent = item.getComponent(ItemEnchantableComponent.componentId);
        let fortuneLevel = undefined, unbreakingLevel = undefined;

        if (enchantableComponent) {
            if (enchantableComponent.hasEnchantment('silk_touch')) return;
            if (enchantableComponent.hasEnchantment('fortune')) {
                fortuneLevel = enchantableComponent.getEnchantment('fortune').level;
            }
            if (enchantableComponent.hasEnchantment('unbreaking')) {
                unbreakingLevel = enchantableComponent.getEnchantment('unbreaking').level;
            }
        }

        const oreData = this.oreData.find(ore => ore.id == block.typeId);
        if (!oreData) return;

        if (this.getPickaxeLevel(item) < oreData.level) return;

        this.processBlock(player, block, item, isRecursive, durabilityComponent, oreData, fortuneLevel, unbreakingLevel);
    }

    static getPickaxeLevel(item) {
        let pickaxeLevel = 5;
        switch (item.typeId) {
            case 'minecraft:wooden_pickaxe':
            case 'minecraft:stone_pickaxe':
                pickaxeLevel = 1;
                break;
            case 'minecraft:iron_pickaxe':
                pickaxeLevel = 3;
                break;
            case 'minecraft:diamond_pickaxe':
                pickaxeLevel = 4;
                break;
            case 'minecraft:netherite_pickaxe':
                pickaxeLevel = 5;
                break;
        }
        return pickaxeLevel;
    }

    static processBlock(player, block, item, isRecursive, durabilityComponent, oreData, fortuneLevel, unbreakingLevel) {
        let currentLevel = durabilityComponent.damage, blocksProcessed = 0, stopProcessing = false;
        const processedBlocks = [];

        function processAdjacentBlocks(currentBlock, isRecursive, isInitial) {
            processedBlocks.push(currentBlock.location);
            if (blocksProcessed >= VeinMiner.limit) return;
            if (stopProcessing) return;

            const blockTypeId = currentBlock.typeId;
            let northBlock, southBlock, eastBlock, westBlock, aboveBlock, belowBlock;
            let northAboveBlock, southAboveBlock, eastAboveBlock, westAboveBlock;
            let northEastBlock, northWestBlock, southEastBlock, southWestBlock;
            let northEastAboveBlock, northWestAboveBlock, southEastAboveBlock, southWestAboveBlock;

            try { northBlock = currentBlock.north(1); } catch { }
            try { southBlock = currentBlock.south(1); } catch { }
            try { eastBlock = currentBlock.east(1); } catch { }
            try { westBlock = currentBlock.west(1); } catch { }
            try { aboveBlock = currentBlock.above(1); } catch { }
            try { belowBlock = currentBlock.below(1); } catch { }

            try { northAboveBlock = currentBlock.north(1).above(1); } catch { }
            try { southAboveBlock = currentBlock.south(1).above(1); } catch { }
            try { eastAboveBlock = currentBlock.east(1).above(1); } catch { }
            try { westAboveBlock = currentBlock.west(1).above(1); } catch { }

            try { northEastBlock = currentBlock.north(1).east(1); } catch { }
            try { northWestBlock = currentBlock.north(1).west(1); } catch { }
            try { southEastBlock = currentBlock.south(1).east(1); } catch { }
            try { southWestBlock = currentBlock.south(1).west(1); } catch { }

            try { northEastAboveBlock = currentBlock.north(1).east(1).above(1); } catch { }
            try { northWestAboveBlock = currentBlock.north(1).west(1).above(1); } catch { }
            try { southEastAboveBlock = currentBlock.south(1).east(1).above(1); } catch { }
            try { southWestAboveBlock = currentBlock.south(1).west(1).above(1); } catch { }

            const adjacentBlocks = [
                northBlock, southBlock, eastBlock, westBlock, aboveBlock, belowBlock,
                northAboveBlock, southAboveBlock, eastAboveBlock, westAboveBlock,
                northEastBlock, northWestBlock, southEastBlock, southWestBlock,
                northEastAboveBlock, northWestAboveBlock, southEastAboveBlock, southWestAboveBlock
            ]

            VeinMiner.breakBlock(currentBlock);

            if (isRecursive && VeinMiner.shouldContinueProcessing(unbreakingLevel)) {
                currentLevel++;
                if (currentLevel == durabilityComponent.maxDurability) {
                    stopProcessing = true;
                    system.runTimeout(() => {
                        player.dimension.runCommand(`tp ${player.location.x} ${player.location.y} ${player.location.z}`);
                        item.setItem(undefined);
                    });
                    return;
                } else {
                    system.runTimeout(() => {
                        const inventory = player.getComponent("inventory");
                        const selectedItem = inventory.container.getItem(player.selectedSlotIndex);
                        if (selectedItem) {
                            applyDurabilityDamage(player, selectedItem, inventory, player.selectedSlotIndex);
                        }
                    }, 1);
                }
            }

            for (const adjacentBlock of adjacentBlocks) {
                if (adjacentBlock != undefined) {
                    const adjacentLocation = adjacentBlock.location;
                    if (adjacentBlock.typeId == blockTypeId && !VeinMiner.isDenied(adjacentLocation, processedBlocks)) {
                        blocksProcessed++;
                        if (player.getGameMode() != GameMode.creative) {
                            processAdjacentBlocks(adjacentBlock, true, false);
                        } else {
                            processAdjacentBlocks(adjacentBlock, false, false);
                        }
                    }
                }
            }
        }

        processAdjacentBlocks(block, false, true);
    }

    static isDenied(location, processedBlocks) {
        let isDenied = false;
        for (const processedBlock of processedBlocks) {
            if (location.x == processedBlock.x && location.y == processedBlock.y && location.z == processedBlock.z) {
                isDenied = true;
            }
        }
        return isDenied;
    }

    static breakBlock(block) {
        const { x, y, z } = block.location;
        system.runTimeout(() => {
            block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} air [] destroy`);
        });
    }

    static shouldContinueProcessing(unbreakingLevel) {
        let shouldContinue = true;
        const randomValue = randomNum(0, 100);
        if (unbreakingLevel == undefined) return shouldContinue;
        switch (unbreakingLevel) {
            case 1:
                if (randomValue <= 20) shouldContinue = false;
                break;
            case 2:
                if (randomValue <= 33.3) shouldContinue = false;
                break;
            case 3:
                if (randomValue <= 50) shouldContinue = false;
                break;
        }
        return shouldContinue;
    }
}

VeinMiner.oreIDs = [
    'minecraft:coal_ore', 'minecraft:deepslate_coal_ore', 'minecraft:copper_ore', 'minecraft:deepslate_copper_ore',
    'minecraft:iron_ore', 'minecraft:deepslate_iron_ore', 'minecraft:gold_ore', 'minecraft:deepslate_gold_ore',
    'minecraft:redstone_ore', 'minecraft:deepslate_redstone_ore', 'minecraft:lapis_ore', 'minecraft:deepslate_lapis_ore',
    'minecraft:diamond_ore', 'minecraft:deepslate_diamond_ore', 'minecraft:emerald_ore', 'minecraft:deepslate_emerald_ore',
    'minecraft:nether_gold_ore', 'minecraft:quartz_ore'
];

VeinMiner.oreData = [
    { id: 'minecraft:coal_ore', level: 1, item: 'minecraft:coal', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:deepslate_coal_ore', level: 1, item: 'minecraft:coal', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:copper_ore', level: 1, item: 'minecraft:raw_copper', itemPerLevel: 5, chance: 0.33 },
    { id: 'minecraft:deepslate_copper_ore', level: 1, item: 'minecraft:raw_copper', itemPerLevel: 5, chance: 0.33 },
    { id: 'minecraft:iron_ore', level: 2, item: 'minecraft:raw_iron', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:deepslate_iron_ore', level: 2, item: 'minecraft:raw_iron', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:gold_ore', level: 3, item: 'minecraft:raw_gold', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:deepslate_gold_ore', level: 3, item: 'minecraft:raw_gold', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:redstone_ore', level: 2, item: 'minecraft:redstone', itemPerLevel: 9, chance: 0.33 },
    { id: 'minecraft:deepslate_redstone_ore', level: 2, item: 'minecraft:redstone', itemPerLevel: 9, chance: 0.33 },
    { id: 'minecraft:lapis_ore', level: 2, item: 'minecraft:lapis_lazuli', itemPerLevel: 9, chance: 0.33 },
    { id: 'minecraft:deepslate_lapis_ore', level: 2, item: 'minecraft:lapis_lazuli', itemPerLevel: 9, chance: 0.33 },
    { id: 'minecraft:diamond_ore', level: 3, item: 'minecraft:diamond', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:deepslate_diamond_ore', level: 3, item: 'minecraft:diamond', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:emerald_ore', level: 3, item: 'minecraft:emerald', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:deepslate_emerald_ore', level: 3, item: 'minecraft:emerald', itemPerLevel: 1, chance: 0.33 },
    { id: 'minecraft:nether_gold_ore', level: 2, item: 'minecraft:gold_nugget', itemPerLevel: 6, chance: 0.33 },
    { id: 'minecraft:quartz_ore', level: 2, item: 'minecraft:quartz', itemPerLevel: 1, chance: 0.33 }
];

VeinMiner.limit = 64;