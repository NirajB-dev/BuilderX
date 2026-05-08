import { Type, Square, Image, Box, Grid3x3, Minus, Frame, Layout, CreditCard, FormInput, Layers, Megaphone } from 'lucide-react';

export interface PropDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'color' | 'select' | 'slider';
  options?: string[];
  min?: number;
  max?: number;
  section: 'content' | 'layout' | 'typography' | 'spacing' | 'styling';
}

export interface ComponentDefinition {
  type: string;
  name: string;
  icon: any;
  category: 'basic' | 'layout' | 'sections';
  defaultProps: Record<string, any>;
  propSchema: PropDef[];
}

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  text: {
    type: 'text',
    name: 'Text',
    icon: Type,
    category: 'basic',
    defaultProps: {
      content: 'Your text here',
      fontSize: 16,
      fontWeight: 'normal',
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'left',
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 16,
      paddingRight: 16,
    },
    propSchema: [
      { key: 'content', label: 'Content', type: 'textarea', section: 'content' },
      { key: 'fontSize', label: 'Font Size', type: 'slider', min: 8, max: 96, section: 'typography' },
      { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'medium', 'semibold', 'bold'], section: 'typography' },
      { key: 'color', label: 'Color', type: 'color', section: 'styling' },
      { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right'], section: 'typography' },
      { key: 'paddingTop', label: 'Padding Top', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingBottom', label: 'Padding Bottom', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingLeft', label: 'Padding Left', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingRight', label: 'Padding Right', type: 'slider', min: 0, max: 128, section: 'spacing' },
    ],
  },
  button: {
    type: 'button',
    name: 'Button',
    icon: Square,
    category: 'basic',
    defaultProps: {
      label: 'Click Me',
      variant: 'primary',
      size: 'md',
      borderRadius: 12,
      align: 'center',
    },
    propSchema: [
      { key: 'label', label: 'Label', type: 'text', section: 'content' },
      { key: 'variant', label: 'Variant', type: 'select', options: ['primary', 'secondary', 'outline'], section: 'styling' },
      { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md', 'lg'], section: 'styling' },
      { key: 'borderRadius', label: 'Border Radius', type: 'slider', min: 0, max: 48, section: 'styling' },
      { key: 'align', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'], section: 'layout' },
    ],
  },
  image: {
    type: 'image',
    name: 'Image',
    icon: Image,
    category: 'basic',
    defaultProps: {
      src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
      alt: 'Image',
      height: 300,
      objectFit: 'cover',
      borderRadius: 12,
    },
    propSchema: [
      { key: 'src', label: 'Source URL', type: 'text', section: 'content' },
      { key: 'alt', label: 'Alt Text', type: 'text', section: 'content' },
      { key: 'height', label: 'Height (px)', type: 'slider', min: 80, max: 800, section: 'layout' },
      { key: 'objectFit', label: 'Object Fit', type: 'select', options: ['cover', 'contain', 'fill'], section: 'styling' },
      { key: 'borderRadius', label: 'Border Radius', type: 'slider', min: 0, max: 48, section: 'styling' },
    ],
  },
  container: {
    type: 'container',
    name: 'Container',
    icon: Box,
    category: 'layout',
    defaultProps: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24,
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 16,
    },
    propSchema: [
      { key: 'display', label: 'Display', type: 'select', options: ['flex', 'grid', 'block'], section: 'layout' },
      { key: 'flexDirection', label: 'Direction', type: 'select', options: ['row', 'column'], section: 'layout' },
      { key: 'gap', label: 'Gap', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'paddingTop', label: 'Padding Top', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingBottom', label: 'Padding Bottom', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingLeft', label: 'Padding Left', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingRight', label: 'Padding Right', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'background', label: 'Background', type: 'color', section: 'styling' },
      { key: 'borderRadius', label: 'Border Radius', type: 'slider', min: 0, max: 64, section: 'styling' },
    ],
  },
  grid: {
    type: 'grid',
    name: 'Grid',
    icon: Grid3x3,
    category: 'layout',
    defaultProps: {
      columns: 3,
      gap: 24,
      paddingTop: 32,
      paddingBottom: 32,
      paddingLeft: 32,
      paddingRight: 32,
    },
    propSchema: [
      { key: 'columns', label: 'Columns', type: 'slider', min: 1, max: 6, section: 'layout' },
      { key: 'gap', label: 'Gap', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'paddingTop', label: 'Padding Top', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingBottom', label: 'Padding Bottom', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingLeft', label: 'Padding Left', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingRight', label: 'Padding Right', type: 'slider', min: 0, max: 128, section: 'spacing' },
    ],
  },
  divider: {
    type: 'divider',
    name: 'Divider',
    icon: Minus,
    category: 'basic',
    defaultProps: {
      color: 'rgba(255,255,255,0.1)',
      thickness: 1,
      marginTop: 8,
      marginBottom: 8,
    },
    propSchema: [
      { key: 'color', label: 'Color', type: 'color', section: 'styling' },
      { key: 'thickness', label: 'Thickness', type: 'slider', min: 1, max: 8, section: 'styling' },
      { key: 'marginTop', label: 'Margin Top', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'marginBottom', label: 'Margin Bottom', type: 'slider', min: 0, max: 64, section: 'spacing' },
    ],
  },
  hero: {
    type: 'hero',
    name: 'Hero Section',
    icon: Frame,
    category: 'sections',
    defaultProps: {
      badge: '✨ New: AI-Powered Design',
      title: 'Build stunning websites\nin minutes, not days',
      subtitle: 'The most advanced visual website builder for developers and designers. Drag, drop, and ship production-ready websites with zero code.',
      ctaPrimary: 'Start Building Free',
      ctaSecondary: 'View Demo',
      paddingTop: 64,
      paddingBottom: 64,
      textAlign: 'center',
    },
    propSchema: [
      { key: 'badge', label: 'Badge Text', type: 'text', section: 'content' },
      { key: 'title', label: 'Title', type: 'textarea', section: 'content' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea', section: 'content' },
      { key: 'ctaPrimary', label: 'Primary CTA', type: 'text', section: 'content' },
      { key: 'ctaSecondary', label: 'Secondary CTA', type: 'text', section: 'content' },
      { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right'], section: 'typography' },
      { key: 'paddingTop', label: 'Padding Top', type: 'slider', min: 16, max: 192, section: 'spacing' },
      { key: 'paddingBottom', label: 'Padding Bottom', type: 'slider', min: 16, max: 192, section: 'spacing' },
    ],
  },
  navbar: {
    type: 'navbar',
    name: 'Navbar',
    icon: Layout,
    category: 'sections',
    defaultProps: {
      logo: 'Logo',
      links: 'Features,Pricing,About',
      ctaLabel: 'Get Started',
      background: 'rgba(10,10,15,0.8)',
    },
    propSchema: [
      { key: 'logo', label: 'Logo Text', type: 'text', section: 'content' },
      { key: 'links', label: 'Nav Links (comma-separated)', type: 'text', section: 'content' },
      { key: 'ctaLabel', label: 'CTA Label', type: 'text', section: 'content' },
      { key: 'background', label: 'Background', type: 'color', section: 'styling' },
    ],
  },
  card: {
    type: 'card',
    name: 'Card',
    icon: CreditCard,
    category: 'sections',
    defaultProps: {
      title: 'Feature Card',
      description: 'Powerful tools to help you build faster and better.',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24,
    },
    propSchema: [
      { key: 'title', label: 'Title', type: 'text', section: 'content' },
      { key: 'description', label: 'Description', type: 'textarea', section: 'content' },
      { key: 'background', label: 'Background', type: 'color', section: 'styling' },
      { key: 'borderRadius', label: 'Border Radius', type: 'slider', min: 0, max: 48, section: 'styling' },
      { key: 'paddingTop', label: 'Padding Top', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'paddingBottom', label: 'Padding Bottom', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'paddingLeft', label: 'Padding Left', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'paddingRight', label: 'Padding Right', type: 'slider', min: 0, max: 64, section: 'spacing' },
    ],
  },
  form: {
    type: 'form',
    name: 'Form',
    icon: FormInput,
    category: 'sections',
    defaultProps: {
      title: 'Contact Us',
      fields: 'Name,Email,Message',
      submitLabel: 'Send Message',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 16,
      paddingTop: 32,
      paddingBottom: 32,
      paddingLeft: 32,
      paddingRight: 32,
    },
    propSchema: [
      { key: 'title', label: 'Title', type: 'text', section: 'content' },
      { key: 'fields', label: 'Fields (comma-separated)', type: 'text', section: 'content' },
      { key: 'submitLabel', label: 'Submit Label', type: 'text', section: 'content' },
      { key: 'borderRadius', label: 'Border Radius', type: 'slider', min: 0, max: 48, section: 'styling' },
      { key: 'background', label: 'Background', type: 'color', section: 'styling' },
      { key: 'paddingTop', label: 'Padding Top', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'paddingBottom', label: 'Padding Bottom', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'paddingLeft', label: 'Padding Left', type: 'slider', min: 0, max: 64, section: 'spacing' },
      { key: 'paddingRight', label: 'Padding Right', type: 'slider', min: 0, max: 64, section: 'spacing' },
    ],
  },
  features: {
    type: 'features',
    name: 'Features Grid',
    icon: Layers,
    category: 'sections',
    defaultProps: {
      title: 'Everything you need',
      subtitle: 'Powerful features to accelerate your workflow',
      cardCount: 3,
      paddingTop: 48,
      paddingBottom: 48,
    },
    propSchema: [
      { key: 'title', label: 'Section Title', type: 'text', section: 'content' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text', section: 'content' },
      { key: 'cardCount', label: 'Card Count', type: 'slider', min: 1, max: 6, section: 'layout' },
      { key: 'paddingTop', label: 'Padding Top', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingBottom', label: 'Padding Bottom', type: 'slider', min: 0, max: 128, section: 'spacing' },
    ],
  },
  cta: {
    type: 'cta',
    name: 'CTA Section',
    icon: Megaphone,
    category: 'sections',
    defaultProps: {
      title: 'Ready to get started?',
      subtitle: 'Join thousands of developers building the future.',
      ctaLabel: 'Create Account',
      paddingTop: 48,
      paddingBottom: 64,
    },
    propSchema: [
      { key: 'title', label: 'Title', type: 'text', section: 'content' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', section: 'content' },
      { key: 'ctaLabel', label: 'CTA Label', type: 'text', section: 'content' },
      { key: 'paddingTop', label: 'Padding Top', type: 'slider', min: 0, max: 128, section: 'spacing' },
      { key: 'paddingBottom', label: 'Padding Bottom', type: 'slider', min: 0, max: 128, section: 'spacing' },
    ],
  },
};

export const REGISTRY_LIST = Object.values(COMPONENT_REGISTRY);

/** Component types that default to full canvas width */
export const FULL_WIDTH_TYPES = new Set([
  'navbar', 'hero', 'features', 'cta', 'divider', 'grid',
]);

/** Default { width, height } in px when adding to free-form canvas */
export const DEFAULT_SIZE: Record<string, { width: number; height: number }> = {
  navbar:   { width: 1440, height: 72  },
  hero:     { width: 1440, height: 500 },
  features: { width: 1440, height: 440 },
  cta:      { width: 1440, height: 220 },
  divider:  { width: 1440, height: 24  },
  grid:     { width: 1440, height: 320 },
  text:     { width: 400,  height: 80  },
  button:   { width: 220,  height: 56  },
  image:    { width: 600,  height: 340 },
  card:     { width: 340,  height: 220 },
  form:     { width: 520,  height: 440 },
  container:{ width: 640,  height: 300 },
};
