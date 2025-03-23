import { TreeCapitator, VeinMiner } from "./processor";
import { Entity, Player, system, world, EquipmentSlot, EntityEquippableComponent } from "@minecraft/server";

export class Activation {
  /**
   * Activates the tree capitator functionality.
   */
  treeCapitatorActivate(data: any) {
    const { block, dimension, itemStack, player } = data;
    if (!itemStack) return;

    const mainhand = player
      .getComponent(EntityEquippableComponent.componentId)
      .getEquipmentSlot(EquipmentSlot.Mainhand);
    const item = mainhand.getItem();
    const splitId = item.typeId.split(":")[1].split("_")[1];
    if (!item) return;
    if(splitId == `axe`) TreeCapitator.startChopping(player, block, item, dimension);
  }

  /**
   * Activates the vein miner functionality.
   */
  veinMinerActivate(data: any) {
    const { block, dimension, itemStack, player } = data;
    if (!itemStack) return;

    const mainhand = player
      .getComponent(EntityEquippableComponent.componentId)
      .getEquipmentSlot(EquipmentSlot.Mainhand);
    const item = mainhand.getItem();
    if (!item) return;
    const splitId = item.typeId.split(":")[1].split("_")[1];
    if (!item) return;
    if(splitId == `pickaxe`) VeinMiner.startMining(player, block, item, dimension);
  }
  /**
   * Activates the both functionality.
   */
  bothActivate(data: any) {
    const { block, dimension, itemStack, player } = data;
    if (!itemStack) return;

    const mainhand = player
      .getComponent(EntityEquippableComponent.componentId)
      .getEquipmentSlot(EquipmentSlot.Mainhand);
    const item = mainhand.getItem();
    if (!item) return;

    TreeCapitator.startChopping(player, block, item, dimension);
    VeinMiner.startMining(player, block, item, dimension);
  }
}
