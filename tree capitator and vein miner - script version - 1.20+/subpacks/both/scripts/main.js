import { world } from '@minecraft/server';
import { Activation } from './keyyard/activation';
world.beforeEvents.playerBreakBlock.subscribe((data)=>{
    const { block, dimension, itemStack, player } = data;
    const activation = new Activation();
    activation.bothActivate(data);
});
