import { world } from "@minecraft/server";
import { Activation } from "./keyyard/activation";
import { onFirstJoin } from "./utils";
world.beforeEvents.playerBreakBlock.subscribe(({ block, dimension, itemStack, player }) => {
  const activation = new Activation();
  if (player.isSneaking) activation.bothActivate({ block, dimension, itemStack, player });
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) onFirstJoin(player);
});
