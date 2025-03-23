import { world, system, Player } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

export class OptionMenu {
  optionMenu(player: Player) {
    const treeActive = player.hasTag("TreeActive");
    const vainActive = player.hasTag("VeinActive");

    const optionForm = new ModalFormData()
      .title("Tree Captivator & Vain Miner Options")
      .toggle("Tree Captivator", treeActive)
      .toggle("Vain Miner", vainActive);

    optionForm
    .show(player)
    .then((formData) => {
      if (formData.formValues === undefined) return;
  
      const [treeSelected, vainSelected] = formData.formValues.map(value => Boolean(value));
  

      this.updateTags(player, "TreeActive", "TreeInActive", treeSelected);
      this.updateTags(player, "VeinActive", "VeinInActive", vainSelected);
    })
  
  }

  private updateTags(player: Player, activeTag: string, inactiveTag: string, isActive: boolean) {
    if (isActive) {
      player.addTag(activeTag);
      player.removeTag(inactiveTag);
    } else {
      player.removeTag(activeTag);
      player.addTag(inactiveTag);
    }
  }
}
