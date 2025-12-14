"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

interface ChurnRiskIndicatorProps {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  factors?: string[];
  recommendations?: string[];
}

export function ChurnRiskIndicator({
  riskLevel,
  riskScore,
  factors = [],
  recommendations = [],
}: ChurnRiskIndicatorProps) {
  const getRiskConfig = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return {
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-300",
          progressColor: "bg-red-600",
          icon: AlertTriangle,
          label: "Critical Risk",
        };
      case "HIGH":
        return {
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-300",
          progressColor: "bg-orange-600",
          icon: AlertCircle,
          label: "High Risk",
        };
      case "MEDIUM":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-300",
          progressColor: "bg-yellow-600",
          icon: Info,
          label: "Medium Risk",
        };
      default:
        return {
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-300",
          progressColor: "bg-green-600",
          icon: CheckCircle,
          label: "Low Risk",
        };
    }
  };

  const config = getRiskConfig(riskLevel);
  const Icon = config.icon;

  return (
    <Card className={`border-2 ${config.borderColor} ${config.bgColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <span>Churn Risk: {config.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Risk Score</span>
            <span className={`text-lg font-bold ${config.color}`}>
              {riskScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${config.progressColor}`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        {factors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-900">Risk Factors:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {factors.map((factor, index) => (
                <li key={index}>{factor}</li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-900">Recommendations:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-blue-700">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

