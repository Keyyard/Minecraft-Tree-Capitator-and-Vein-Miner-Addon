import { world } from "@minecraft/server";
import { Activation } from "./keyyard/activation";
import { OptionMenu } from "./optionMenu";
import { onFirstJoin } from "./utils";

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
  const Option = new OptionMenu();
  if (itemStack.typeId == `keyyard:option_controller`) {
    Option.optionMenu(source);
  }
});

world.beforeEvents.playerBreakBlock.subscribe(({ block, dimension, itemStack, player }) => {
  const activation = new Activation();
  if (player.isSneaking && player.getTags().includes(`TreeActive`))
    activation.treeCapitatorActivate({ block, dimension, itemStack, player });
  if (player.isSneaking && player.getTags().includes(`VeinActive`))
    activation.veinMinerActivate({ block, dimension, itemStack, player });
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) onFirstJoin(player);
  const Tags = ["TreeActive", "VeinActive", "TreeInactive", "VeinInactive"];
  if (!player.getTags().some((tag) => Tags.includes(tag))) {
    player.addTag("TreeActive");
    player.addTag("VeinActive");
  }
});
