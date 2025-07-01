import { Player } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

export class OptionMenu {
  optionMenu(player: Player) {
    const treeActive = player.hasTag("TreeActive");
    const veinActive = player.hasTag("VeinActive");

    const optionForm = new ModalFormData()
      .title("Tree Captivator & Vein Miner Options")
      .toggle("Tree Captivator", treeActive)
      .toggle("Vein Miner", veinActive);

    optionForm.show(player).then((formData) => {
      if (formData.formValues === undefined) return;

      const [treeSelected, veinSelected] = formData.formValues.map((value) => Boolean(value));

      this.updateTags(player, "TreeActive", "TreeInactive", treeSelected);
      this.updateTags(player, "VeinActive", "VeinInactive", veinSelected);
    });
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
