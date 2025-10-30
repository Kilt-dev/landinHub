import { sections } from './sections.js';
import { elements } from './elements.js';
import { popups } from './popups.js';
import { templates } from './templates.js';
import { advancedElements } from './advancedElements.js';
import { modernSections } from './modernSections.js';

// Merge modernSections với sections cũ
const mergedSections = {
    name: sections.name,
    subCategories: [
        ...modernSections.subCategories, // Modern templates trước
        ...sections.subCategories,       // Legacy templates sau
    ]
};

export const EXTENDED_LIBRARY = {
    sections: mergedSections,
    elements,
    popups,
    templates,
    advancedElements,
};