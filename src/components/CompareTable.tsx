'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface CompareTableProps {
  comparisonData: {
    versions: Array<{
      id: string;
      name: string;
      price: number;
      engine: {
        displacement: number;
        type: string;
        power: number;
        torque: number;
      };
      performance: {
        topSpeed: number;
        acceleration: number;
        weight: number;
      };
      dimensions: {
        length: number;
        width: number;
        height: number;
        wheelbase: number;
      };
      features: {
        abs: boolean;
        tcs: boolean;
        quickshifter: boolean;
        cruiseControl: boolean;
        ledLights: boolean;
      };
    }>;
    similarities: {
      engine: string[];
      performance: string[];
      dimensions: string[];
      safety: string[];
      comfort: string[];
    };
    differences: {
      engine: Array<{
        feature: string;
        values: Array<{
          version: string;
          value: any;
        }>;
      }>;
      performance: Array<{
        feature: string;
        values: Array<{
          version: string;
          value: any;
        }>;
      }>;
      dimensions: Array<{
        feature: string;
        values: Array<{
          version: string;
          value: any;
        }>;
      }>;
      safety: Array<{
        feature: string;
        values: Array<{
          version: string;
          value: any;
        }>;
      }>;
      comfort: Array<{
        feature: string;
        values: Array<{
          version: string;
          value: any;
        }>;
      }>;
      price: Array<{
        feature: string;
        values: Array<{
          version: string;
          value: number;
        }>;
      }>;
    };
  };
  onRemoveVersion?: (versionId: string) => void;
}

const CompareTable: React.FC<CompareTableProps> = ({ comparisonData, onRemoveVersion }) => {
  const [activeTab, setActiveTab] = useState('differences');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(price).replace('TND', 'TND');
  };

  const renderFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      );
    }
    if (typeof value === 'number') {
      return <span className="font-medium">{value.toLocaleString()}</span>;
    }
    return <span>{value}</span>;
  };

  const SimilaritiesTab = () => (
    <div className="space-y-6">
      {Object.entries(comparisonData.similarities).map(([category, items]) => (
        items.length > 0 && (
          <Card key={category} className="bg-surface border-accent">
            <CardHeader>
              <CardTitle className="text-lg text-fg capitalize">
                {category === 'engine' && 'Moteur'}
                {category === 'performance' && 'Performance'}
                {category === 'dimensions' && 'Dimensions'}
                {category === 'safety' && 'Sécurité'}
                {category === 'comfort' && 'Confort'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-fg">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );

  const DifferencesTab = () => (
    <div className="space-y-6">
      {Object.entries(comparisonData.differences).map(([category, items]) => (
        items.length > 0 && (
          <Card key={category} className="bg-surface border-accent">
            <CardHeader>
              <CardTitle className="text-lg text-fg capitalize">
                {category === 'engine' && 'Moteur'}
                {category === 'performance' && 'Performance'}
                {category === 'dimensions' && 'Dimensions'}
                {category === 'safety' && 'Sécurité'}
                {category === 'comfort' && 'Confort'}
                {category === 'price' && 'Prix'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((diff, index) => (
                  <div key={index} className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-accent">
                          <th className="text-left py-2 text-fg font-medium min-w-[150px]">
                            {diff.feature}
                          </th>
                          {comparisonData.versions.map((version) => (
                            <th key={version.id} className="text-center py-2 text-fg font-medium min-w-[120px]">
                              <div className="truncate">{version.name.split(' ')[0]}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2"></td>
                          {comparisonData.versions.map((version) => {
                            const versionValue = diff.values.find(v => v.version === version.name);
                            return (
                              <td key={version.id} className="text-center py-2">
                                {versionValue && renderFeatureValue(versionValue.value)}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Versions Header */}
      <Card className="bg-surface border-accent">
        <CardHeader>
          <CardTitle className="text-xl text-fg">Comparaison des versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonData.versions.map((version) => (
              <div key={version.id} className="bg-bg border border-accent rounded-lg p-4 relative">
                {onRemoveVersion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-muted hover:text-fg"
                    onClick={() => onRemoveVersion(version.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <h3 className="font-semibold text-fg mb-2 pr-8">{version.name}</h3>
                <div className="text-2xl font-bold text-brand-300 mb-2">
                  {formatPrice(version.price)}
                </div>
                <div className="space-y-1 text-sm text-muted">
                  <div>{version.engine.displacement}cc - {version.engine.power}ch</div>
                  <div>{version.performance.topSpeed} km/h - {version.performance.weight}kg</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-surface border border-accent">
          <TabsTrigger 
            value="differences" 
            className="data-[state=active]:bg-brand-700 data-[state=active]:text-fg"
          >
            Différences
          </TabsTrigger>
          <TabsTrigger 
            value="similarities"
            className="data-[state=active]:bg-brand-700 data-[state=active]:text-fg"
          >
            Similitudes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="differences" className="space-y-4">
          <DifferencesTab />
        </TabsContent>

        <TabsContent value="similarities" className="space-y-4">
          <SimilaritiesTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CompareTable;