import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button,
  TextField, Select, Checkbox, Radio, Toggle,
  Card,
  Progress,
  Badge
} from '../components/ui/design-system';
import { Plus, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const DesignSystem = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isToggled, setIsToggled] = useState(false);

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center">
            <H1 className="text-primary mb-4">VisionWare Design System</H1>
            <LargeText className="text-gray-600">
              Comprehensive UI component library based on Figma specifications
            </LargeText>
          </div>

          {/* Typography Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Typography</H2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <H3>Headings</H3>
                <div className="space-y-2">
                  <H1>Heading 1 (56px)</H1>
                  <H2>Heading 2 (48px)</H2>
                  <H3>Heading 3 (40px)</H3>
                  <H4>Heading 4 (32px)</H4>
                  <H5>Heading 5 (24px)</H5>
                  <H6>Heading 6 (20px)</H6>
                </div>
              </div>
              
              <div className="space-y-4">
                <H3>Body Text</H3>
                <div className="space-y-2">
                  <LargeText>Large Text (20px) - Lorem ipsum dolor sit amet</LargeText>
                  <MediumText>Medium Text (18px) - Lorem ipsum dolor sit amet</MediumText>
                  <NormalText>Normal Text (16px) - Lorem ipsum dolor sit amet</NormalText>
                  <SmallText>Small Text (14px) - Lorem ipsum dolor sit amet</SmallText>
                </div>
              </div>
            </div>
          </section>

          {/* Colors Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Color Palette</H2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
                <SmallText>Primary</SmallText>
                <SmallText className="text-gray-500">#092C4C</SmallText>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary rounded-lg mx-auto mb-2"></div>
                <SmallText>Secondary</SmallText>
                <SmallText className="text-gray-500">#F2994A</SmallText>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-info rounded-lg mx-auto mb-2"></div>
                <SmallText>Info</SmallText>
                <SmallText className="text-gray-500">#2F80ED</SmallText>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-success rounded-lg mx-auto mb-2"></div>
                <SmallText>Success</SmallText>
                <SmallText className="text-gray-500">#27AE60</SmallText>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-warning rounded-lg mx-auto mb-2"></div>
                <SmallText>Warning</SmallText>
                <SmallText className="text-gray-500">#E2B93B</SmallText>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-error rounded-lg mx-auto mb-2"></div>
                <SmallText>Error</SmallText>
                <SmallText className="text-gray-500">#EB5757</SmallText>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-lg mx-auto mb-2"></div>
                <SmallText>Dark</SmallText>
                <SmallText className="text-gray-500">#333333</SmallText>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg mx-auto mb-2"></div>
                <SmallText>Light</SmallText>
                <SmallText className="text-gray-500">#E0E0E0</SmallText>
              </div>
            </div>
          </section>

          {/* Buttons Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Buttons</H2>
            
            <div className="space-y-6">
              {/* Button Variants */}
              <div>
                <H4 className="mb-4">Variants</H4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="icon" icon={<Plus />} />
                </div>
              </div>
              
              {/* Button Sizes */}
              <div>
                <H4 className="mb-4">Sizes</H4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="small">Small</Button>
                  <Button size="normal">Normal</Button>
                  <Button size="medium">Medium</Button>
                  <Button size="large">Large</Button>
                </div>
              </div>
              
              {/* Full Width Buttons */}
              <div>
                <H4 className="mb-4">Full Width</H4>
                <div className="space-y-4">
                  <Button variant="primary" fullWidth>Full Width Primary</Button>
                  <Button variant="secondary" fullWidth>Full Width Secondary</Button>
                </div>
              </div>
            </div>
          </section>

          {/* Form Elements Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Form Elements</H2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Text Fields */}
              <div className="space-y-6">
                <H4>Text Fields</H4>
                
                <TextField
                  label="Label Sample"
                  placeholder="Placeholder"
                  statusMessage="Status"
                />
                
                <TextField
                  placeholder="Input Text"
                  statusMessage="Status"
                />
                
                <TextField
                  label="Label Sample"
                  placeholder="Input Text"
                  statusMessage="Empty"
                />
                
                <TextField
                  label="Label Sample"
                  placeholder="Input Text icon"
                  icon={<User className="w-4 h-4 text-gray-400" />}
                  statusMessage="Status"
                />
                
                <TextField
                  label="Label Sample"
                  placeholder="Enter Text Here"
                  status="success"
                  statusMessage="Success!"
                />
                
                <TextField
                  label="Label Sample"
                  placeholder="Input Text"
                  status="warning"
                  statusMessage="Warning!"
                />
                
                <TextField
                  label="Label Sample"
                  placeholder="Input Text"
                  status="error"
                  statusMessage="Error!"
                />
              </div>
              
              {/* Selectors */}
              <div className="space-y-6">
                <H4>Selectors</H4>
                
                <Select
                  label="Dropdown"
                  options={selectOptions}
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                
                <div className="space-y-4">
                  <Checkbox
                    label="Checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                  />
                  
                  <Radio
                    label="Radio Button"
                    name="radio-group"
                  />
                  
                  <Toggle
                    label="Toggle ON"
                    checked={isToggled}
                    onChange={(e) => setIsToggled(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Cards Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Cards</H2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                variant="image"
                image="https://images.unsplash.com/photo-1506905925346-21bda4d75df4?w=400&h=300&fit=crop"
                title="Card Title"
                description="Some quick example text to build on the card title and make up the bulk of the card's content."
                action={<Button variant="outline" size="small">Link</Button>}
              />
              
              <Card
                variant="header"
                title="Header"
                description="Some quick example text to build on the card title and make up the bulk of the card's content."
                action={<Button variant="primary" size="small">Read More</Button>}
              />
              
              <Card
                variant="subtitle"
                subtitle="Card Subtitle"
                title="Card Title"
                description="Some quick example text to build on the card title and make up the bulk of the card's content."
                action={<Button variant="outline" size="small">Link</Button>}
              />
            </div>
          </section>

          {/* Progress Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Progress Indicators</H2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <H4>Linear Progress</H4>
                <Progress value={50} max={100} showLabel />
                <Progress value={75} max={100} showLabel />
                <Progress value={25} max={100} showLabel />
              </div>
              
              <div className="space-y-6">
                <H4>Circular Progress</H4>
                <div className="flex gap-8">
                  <Progress variant="circular" value={75} max={100} size="small" showLabel />
                  <Progress variant="circular" value={50} max={100} size="medium" showLabel />
                  <Progress variant="circular" value={25} max={100} size="large" showLabel />
                </div>
              </div>
            </div>
          </section>

          {/* Badges Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Badges</H2>
            
            <div className="space-y-6">
              <div>
                <H4 className="mb-4">Variants</H4>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="light">Light</Badge>
                  <Badge variant="dark">Dark</Badge>
                </div>
              </div>
              
              <div>
                <H4 className="mb-4">Sizes</H4>
                <div className="flex flex-wrap items-center gap-4">
                  <Badge size="small">Small</Badge>
                  <Badge size="medium">Medium</Badge>
                  <Badge size="large">Large</Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Spacing Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Spacing Scale</H2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[8, 16, 24, 32, 40, 56, 72, 80, 96, 120].map((space) => (
                <div key={space} className="text-center">
                  <div 
                    className="bg-primary rounded mx-auto mb-2"
                    style={{ width: `${space}px`, height: `${space}px` }}
                  ></div>
                  <SmallText>{space}px</SmallText>
                </div>
              ))}
            </div>
          </section>

          {/* Grid System Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Grid System</H2>
            
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg border">
                <H4 className="mb-4">Responsive Breakpoints</H4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-100 rounded">
                    <H6>Desktop HD</H6>
                    <SmallText>1440px</SmallText>
                    <SmallText>12 columns</SmallText>
                  </div>
                  <div className="text-center p-4 bg-gray-100 rounded">
                    <H6>Desktop</H6>
                    <SmallText>1024px</SmallText>
                    <SmallText>12 columns</SmallText>
                  </div>
                  <div className="text-center p-4 bg-gray-100 rounded">
                    <H6>Tablet</H6>
                    <SmallText>768px</SmallText>
                    <SmallText>6 columns</SmallText>
                  </div>
                  <div className="text-center p-4 bg-gray-100 rounded">
                    <H6>Mobile</H6>
                    <SmallText>320px</SmallText>
                    <SmallText>2 columns</SmallText>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Animation Section */}
          <section className="space-y-8">
            <H2 className="text-primary">Animation & Transitions</H2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <H4 className="mb-4">Micro-interactions</H4>
                <SmallText className="text-gray-600 mb-4">150-200ms</SmallText>
                <Button className="transition-micro">Hover Me</Button>
              </div>
              
              <div className="bg-white p-6 rounded-lg border">
                <H4 className="mb-4">Component Transitions</H4>
                <SmallText className="text-gray-600 mb-4">250-300ms</SmallText>
                <Button className="transition-component">Animate Me</Button>
              </div>
              
              <div className="bg-white p-6 rounded-lg border">
                <H4 className="mb-4">Page Transitions</H4>
                <SmallText className="text-gray-600 mb-4">400-500ms</SmallText>
                <Button className="transition-page">Page Change</Button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default DesignSystem; 