"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-dropdown-menu";

type Strength = "Too Short" | "Weak" | "Medium" | "Strong";

export function PasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getPasswordStrength = (password: string): Strength => {
    if (password.length < 6) return "Too Short";

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[@$!%*#?&]/.test(password);

    const score = [hasLower, hasUpper, hasNumber, hasSymbol].filter(
      Boolean
    ).length;

    if (score >= 4 && password.length >= 8) return "Strong";
    if (score >= 2) return "Medium";
    return "Weak";
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const strengthColor = {
    "Too Short": "bg-gray-300",
    Weak: "bg-red-500",
    Medium: "bg-yellow-500",
    Strong: "bg-green-500",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  const handleSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (passwordStrength !== "Strong") {
      setError("Please choose a stronger password.");
      return;
    }

    const res = await fetch("/api/me/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      setMessage(result.message || "Password changed successfully.");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setError(result.error || "Failed to change password.");
    }
  };

  const toggleVisibility = (field: "current" | "new" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="p-4 border rounded-xl border-gray-200 space-y-5">
      <h3 className="text-xl font-semibold text-gray-900 capitalize mb-4">
        password
      </h3>
      <div className="max-w-md space-y-4">
        {/* Current Password */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold capitalize text-gray-700 mb-1">
            Current Password
          </Label>

          <div className="relative">
            <Input
              type={showPassword.current ? "text" : "password"}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              // placeholder="Current Password"
              className="w-full p-3 border rounded-md border-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition duration-150"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm"
              onClick={() => toggleVisibility("current")}
            >
              {showPassword.current ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {/* New Password with Strength Meter */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold capitalize text-gray-700 mb-1">
            new password
          </Label>

          <div className="relative space-y-1">
            <Input
              type={showPassword.new ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              // placeholder="New Password"
              className="w-full p-3 border rounded-md border-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition duration-150"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm"
              onClick={() => toggleVisibility("new")}
            >
              {showPassword.new ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {formData.newPassword && (
              <div>
                <div className="h-2 rounded-lg bg-gray-200 mt-1">
                  <div
                    className={`h-2 rounded-lg ${strengthColor[passwordStrength]}`}
                    style={{
                      width:
                        passwordStrength === "Too Short"
                          ? "25%"
                          : passwordStrength === "Weak"
                          ? "33%"
                          : passwordStrength === "Medium"
                          ? "66%"
                          : "100%",
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Strength: {passwordStrength}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Confirm Password */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold capitalize text-gray-700 mb-1">
            confirm new Password
          </Label>
          <div className="relative">
            <Input
              type={showPassword.confirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              // placeholder="Confirm New Password"
              className="w-full p-3 border rounded-md border-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition duration-150"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm"
              onClick={() => toggleVisibility("confirm")}
            >
              {showPassword.confirm ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Change Password
      </button>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
    </div>
  );
}
