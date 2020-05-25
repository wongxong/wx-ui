

export class SelectParser {
  constructor($field) {
    this.$field = $field;
    this.$refs = $field.childNodes;
    this.parsed = [];

    for(let i = 0, length = this.$refs.length; i < length; i++) {
      this.add_node(this.$refs[i]);
    }
  }

  add_node(node) {
    if(node.nodeType !== 1) return;
    if(node.tagName.toUpperCase() === 'OPTGROUP') {
      this.add_group(node);
    } else {
      this.add_option(node);
    }
  }

  add_group(group) {
    const $refs = group.childNodes;
    for(let i = 0, length = $refs.length; i < length; i++) {
      this.add_option($refs[i], group);
    }
  }

  add_option(option) {
    if(option.tagName.toUpperCase() === 'OPTION') {
      if(option.text) {
        this.parsed.push({
          value: option.value,
          text: option.text,
          selected: option.selected,
          disabled: option.disabled
        });
      }
    }
  }
}

export function selectParser($field) {
  if(!$field) return [];
  return (new SelectParser($field)).parsed;
}