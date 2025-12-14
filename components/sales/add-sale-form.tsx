"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Receipt,
  User,
  DollarSign,
  Calendar,
  CreditCard,
  X,
  Search,
} from "lucide-react";
import Link from "next/link";
import { PaymentMethod, PaymentStatus, SaleStatus } from "@prisma/client";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  currentStock: number;
  unit: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface SaleItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function AddSaleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        productSearchRef.current &&
        !productSearchRef.current.contains(event.target as Node)
      ) {
        setShowProductSearch(false);
      }
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target as Node)
      ) {
        setShowCustomerSearch(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [formData, setFormData] = useState({
    customerId: "",
    items: [] as SaleItem[],
    discount: "0",
    tax: "0",
    paymentMethod: PaymentMethod.CASH,
    paymentStatus: PaymentStatus.PAID,
    status: SaleStatus.COMPLETED,
    saleDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: "",
    notes: "",
    amountPaid: "",
  });

  // Fetch products and customers
  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, customersRes] = await Promise.all([
          fetch("/api/products?limit=100"),
          fetch("/api/customers?limit=100"),
        ]);

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        if (productsData.success) {
          setProducts(productsData.data);
        }
        if (customersData.success) {
          setCustomers(customersData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-calculate amount paid if payment status is PAID
    if (name === "paymentStatus" && value === PaymentStatus.PAID) {
      const total = calculateTotal();
      setFormData((prev) => ({
        ...prev,
        amountPaid: total.toFixed(2),
      }));
    }
  };

  const addItem = (product?: Product) => {
    if (product) {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: Number(product.sellingPrice),
        totalPrice: Number(product.sellingPrice),
      };
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setSearchProduct("");
      setShowProductSearch(false);
    } else {
      // Manual item entry
      const newItem: SaleItem = {
        productName: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      };
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      // Recalculate total price
      if (field === "quantity" || field === "unitPrice") {
        newItems[index].totalPrice =
          newItems[index].quantity * newItems[index].unitPrice;
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(formData.discount) || 0;
    const tax = parseFloat(formData.tax) || 0;
    return subtotal - discount + tax;
  };

  const calculateBalanceDue = () => {
    const total = calculateTotal();
    const amountPaid = parseFloat(formData.amountPaid) || 0;
    return Math.max(0, total - amountPaid);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      c.phone.includes(searchCustomer)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      setError("Please add at least one item to the sale");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const subtotal = calculateSubtotal();
      const total = calculateTotal();
      const amountPaid = parseFloat(formData.amountPaid) || 0;

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId || null,
          items: formData.items,
          subtotal,
          discount: parseFloat(formData.discount) || 0,
          tax: parseFloat(formData.tax) || 0,
          totalAmount: total,
          amountPaid,
          paymentMethod: formData.paymentMethod,
          paymentStatus: formData.paymentStatus,
          status: formData.status,
          saleDate: formData.saleDate,
          dueDate: formData.dueDate || null,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create sale");
      }

      // Redirect to sales page
      router.push("/dashboard/admin/sales");
    } catch (err: any) {
      setError(err.message || "Failed to create sale");
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === formData.customerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/sales">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Sale</h1>
            <p className="text-gray-600 mt-1">
              Create a new sales transaction
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative" ref={customerSearchRef}>
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedCustomer.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedCustomer.phone}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, customerId: "" }))
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          placeholder="Search customer by name or phone..."
                          value={searchCustomer}
                          onChange={(e) => {
                            setSearchCustomer(e.target.value);
                            setShowCustomerSearch(true);
                          }}
                          onFocus={() => setShowCustomerSearch(true)}
                          className="pl-10 text-gray-900"
                        />
                      </div>
                      {showCustomerSearch && searchCustomer && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    customerId: customer.id,
                                  }));
                                  setSearchCustomer("");
                                  setShowCustomerSearch(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <p className="font-medium text-gray-900">
                                  {customer.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {customer.phone}
                                </p>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No customers found
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sale Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Sale Items
                  </CardTitle>
                  <div className="relative" ref={productSearchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchProduct}
                        onChange={(e) => {
                          setSearchProduct(e.target.value);
                          setShowProductSearch(true);
                        }}
                        onFocus={() => setShowProductSearch(true)}
                        className="pl-10 w-64 text-gray-900"
                      />
                    </div>
                    {showProductSearch && searchProduct && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => addItem(product)}
                              disabled={product.currentStock === 0}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {product.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {product.sku} • Stock: {product.currentStock}{" "}
                                    {product.unit} •{" "}
                                    {new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "SLL",
                                      minimumFractionDigits: 0,
                                    }).format(product.sellingPrice)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No products found
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addItem()}
                      className="ml-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No items added. Search for a product or click "Add Item" to
                    add manually.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-5">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Product Name
                            </label>
                            <Input
                              type="text"
                              value={item.productName}
                              onChange={(e) =>
                                updateItem(index, "productName", e.target.value)
                              }
                              placeholder="Enter product name"
                              className="text-gray-900"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Quantity
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="text-gray-900"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Unit Price
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="text-gray-900"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Total
                            </label>
                            <Input
                              type="text"
                              value={new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "SLL",
                                minimumFractionDigits: 0,
                              }).format(item.totalPrice)}
                              disabled
                              className="text-gray-900 bg-gray-50"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={PaymentMethod.CASH}>Cash</option>
                      <option value={PaymentMethod.MOBILE_MONEY}>
                        Mobile Money
                      </option>
                      <option value={PaymentMethod.BANK_TRANSFER}>
                        Bank Transfer
                      </option>
                      <option value={PaymentMethod.POS}>POS</option>
                      <option value={PaymentMethod.CREDIT}>Credit</option>
                      <option value={PaymentMethod.CHEQUE}>Cheque</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Payment Status
                    </label>
                    <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={PaymentStatus.PAID}>Paid</option>
                      <option value={PaymentStatus.PARTIAL}>Partial</option>
                      <option value={PaymentStatus.PENDING}>Pending</option>
                      <option value={PaymentStatus.OVERDUE}>Overdue</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Amount Paid
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    name="amountPaid"
                    value={formData.amountPaid}
                    onChange={handleChange}
                    disabled={loading}
                    className="text-gray-900"
                  />
                </div>

                {formData.paymentStatus !== PaymentStatus.PAID && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      disabled={loading}
                      className="text-gray-900"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sale Date
                  </label>
                  <Input
                    type="date"
                    name="saleDate"
                    value={formData.saleDate}
                    onChange={handleChange}
                    disabled={loading}
                    className="text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-gray-900">Sale Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "SLL",
                        minimumFractionDigits: 0,
                      }).format(calculateSubtotal())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-24 h-8 text-sm text-gray-900"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-24 h-8 text-sm text-gray-900"
                    />
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-lg text-gray-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "SLL",
                        minimumFractionDigits: 0,
                      }).format(calculateTotal())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "SLL",
                        minimumFractionDigits: 0,
                      }).format(parseFloat(formData.amountPaid) || 0)}
                    </span>
                  </div>
                  {calculateBalanceDue() > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="text-orange-600 font-medium">
                        Balance Due
                      </span>
                      <span className="font-bold text-orange-600">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "SLL",
                          minimumFractionDigits: 0,
                        }).format(calculateBalanceDue())}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={loading || formData.items.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      "Processing..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Complete Sale
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

