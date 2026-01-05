"use client";

import { useState, useEffect } from "react";
import { SlideModal } from "@/components/ui/slide-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Building,
  FileText,
  Save,
  X,
} from "lucide-react";
import { CustomerType } from "@prisma/client";
import { AlertCircle } from "lucide-react";

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  city: string;
  type: CustomerType;
  tags: string[];
  notes?: string | null;
  region?: { id: string; name: string } | null;
  district?: { id: string; name: string } | null;
  country?: { id: string; name: string } | null;
}

interface CustomerEditModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  mode: "view" | "edit";
}

export function CustomerEditModal({
  customer,
  isOpen,
  onClose,
  onSave,
  mode: initialMode,
}: CustomerEditModalProps) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    address: "",
    city: "",
    type: CustomerType.RETAIL,
    tags: [] as string[],
    notes: "",
  });

  useEffect(() => {
    if (customer) {
      const nameParts = customer.name.split(" ");
      setFormData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phone: customer.phone || "",
        alternatePhone: customer.alternatePhone || "",
        email: customer.email || "",
        address: customer.address || "",
        city: customer.city || "",
        type: customer.type,
        tags: customer.tags || [],
        notes: customer.notes || "",
      });
      setMode(initialMode);
      setError(null);
    }
  }, [customer, initialMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${customer?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          alternatePhone: formData.alternatePhone || null,
          address: formData.address || null,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update customer");
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  const footer = (
    <div className="flex items-center justify-end gap-3">
      {mode === "edit" && (
        <Button variant="outline" onClick={() => setMode("view")} disabled={loading}>
          Cancel
        </Button>
      )}
      {mode === "view" && (
        <Button onClick={() => setMode("edit")}>Edit Customer</Button>
      )}
      {mode === "edit" && (
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      )}
    </div>
  );

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "view" ? `View Customer: ${customer.name}` : `Edit Customer: ${customer.name}`}
      footer={footer}
    >
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={mode === "view" || loading}
                      className="pl-10 text-gray-900"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Alternate Phone
                  </label>
                  <div className="relative">
                    <Input
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                      disabled={mode === "view" || loading}
                      className="pl-10 text-gray-900"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="pl-10 text-gray-900"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
              </div>
              {customer.region && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Region:</span> {customer.region.name}
                  {customer.district && ` • District: ${customer.district.name}`}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Type & Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Customer Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Customer Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={mode === "view" || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={CustomerType.RETAIL}>Retail</option>
                  <option value={CustomerType.WHOLESALE}>Wholesale</option>
                  <option value={CustomerType.CORPORATE}>Corporate</option>
                  <option value={CustomerType.REGULAR}>Regular</option>
                  <option value={CustomerType.WALK_IN}>Walk-in</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tags</label>
                {mode === "edit" && (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      disabled={loading}
                      className="text-gray-900"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={loading || !tagInput.trim()}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                )}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {tag}
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={mode === "view" || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Customer Code:</span>
                    <span className="ml-2 font-medium text-gray-900">{customer.customerCode}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </SlideModal>
  );
}

