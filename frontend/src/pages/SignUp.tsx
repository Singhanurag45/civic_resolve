import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import civicIssueLogo from "../assets/civic-issue.png";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs.tsx";
import { Label } from "../components/ui/label.tsx";
import { Input } from "../components/ui/input.tsx";
import { Button } from "../components/ui/button.tsx";
import { Checkbox } from "../components/ui/checkbox.tsx";
import { motion, AnimatePresence } from "framer-motion";
// import.meta.env.VITE_API_BASE_URL;
import { DEPARTMENTS } from "../constants/departments";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [citizenOtp, setCitizenOtp] = useState("");
  const [isCitizenOtpSent, setIsCitizenOtpSent] = useState(false);
  const [isCitizenSubmitting, setIsCitizenSubmitting] = useState(false);
  const [citizenForm, setCitizenForm] = useState({
    fullName: "",
    email: "",
    phonenumber: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [adminForm, setAdminForm] = useState({
    fullName: "",
    email: "",
    phonenumber: "",
    department: "",
    adminAccessCode: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [citizenErrors, setCitizenErrors] = useState<Record<string, string>>(
    {}
  );
  const [adminErrors, setAdminErrors] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState("citizen");
  const navigate = useNavigate();

  // Password validation: min 8 chars, uppercase, lowercase, digit, special char
  const validatePassword = (password: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const validateCitizenForm = () => {
    if (!citizenForm.fullName.trim() || !citizenForm.email.trim()) {
      toast.error("Please fill all required fields.");
      return false;
    }

    if (!validatePassword(citizenForm.password)) {
      toast.error(
        "Password must be at least 8 characters, include uppercase, lowercase, number and special character."
      );
      return false;
    }
    if (citizenForm.password !== citizenForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    if (!citizenForm.agreeToTerms) {
      toast.error("Please agree to the terms and conditions.");
      return false;
    }
    if (
      citizenForm.phonenumber.trim().length !== 10 ||
      !/^\d{10}$/.test(citizenForm.phonenumber.trim())
    ) {
      toast.error("Phone number must be exactly 10 digits.");
      return false;
    }

    return true;
  };

  // Citizen signup handler
  const handleCitizenSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setCitizenErrors({});

    if (!validateCitizenForm()) {
      return;
    }

    try {
      setIsCitizenSubmitting(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/citizen/signup/request-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: citizenForm.fullName,
            email: citizenForm.email,
            password: citizenForm.password,
            phonenumber: citizenForm.phonenumber,
          }),
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          toast.error(`Server error: ${response.status} ${response.statusText}`);
          return;
        }

        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errs: Record<string, string> = {};
          errorData.errors.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              errs[err.path[0]] = err.message;
            }
          });
          setCitizenErrors(errs);
        } else {
          toast.error(errorData.message || "Something went wrong! Please try again.");
        }
        return;
      }

      const result = await response.json();
      setCitizenOtp("");
      setIsCitizenOtpSent(true);
      toast.success(
        result.message || "OTP sent successfully. Check your email inbox."
      );
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error(
          "Cannot connect to server. Please check if the backend is running."
        );
      } else if (error.message?.includes("CORS")) {
        toast.error("CORS error: Please check backend CORS configuration.");
      } else {
        toast.error("Something went wrong! Please try again.");
      }
      console.error("Signup error:", error);
    } finally {
      setIsCitizenSubmitting(false);
    }
  };

  const handleCitizenOtpVerification = async () => {
    setCitizenErrors({});

    if (!isCitizenOtpSent) {
      toast.error("Please request an OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(citizenOtp.trim())) {
      toast.error("Enter the 6-digit OTP sent to your email.");
      return;
    }

    try {
      setIsCitizenSubmitting(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/citizen/signup/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: citizenForm.email,
            otp: citizenOtp.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "OTP verification failed.");
        return;
      }

      toast.success("Registration successful! You can now sign in.");
      navigate("/signin");
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error(
          "Cannot connect to server. Please check if the backend is running."
        );
      } else {
        toast.error("Something went wrong! Please try again.");
      }
      console.error("OTP verification error:", error);
    } finally {
      setIsCitizenSubmitting(false);
    }
  };

  const resetCitizenOtpFlow = () => {
    setCitizenOtp("");
    setIsCitizenOtpSent(false);
  };

  // Admin signup handler
  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminErrors({});

    if (!validatePassword(adminForm.password)) {
      toast.error(
        "Password must be at least 8 characters, include uppercase, lowercase, number and special character."
      );
      return;
    }
    if (adminForm.password !== adminForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!adminForm.agreeToTerms) {
      toast.error("Please agree to the terms and conditions.");
      return;
    }
    if (
      !adminForm.fullName.trim() ||
      !adminForm.email.trim() ||
      !adminForm.phonenumber.trim() ||
      !adminForm.department.trim() ||
      !adminForm.adminAccessCode.trim()
    ) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (
      adminForm.phonenumber.trim().length !== 10 ||
      !/^\d{10}$/.test(adminForm.phonenumber.trim())
    ) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    if (!/^\d{4,}$/.test(adminForm.adminAccessCode)) {
      toast.error("Admin access code must be at least 4 digits.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: adminForm.fullName,
            email: adminForm.email,
            password: adminForm.password,
            phonenumber: adminForm.phonenumber,
            department: adminForm.department,
            adminAccessCode: Number(adminForm.adminAccessCode.trim()),
          }),
        }
      );

      // Check if response is ok before parsing
      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If JSON parsing fails, use status text
          toast.error(`Server error: ${response.status} ${response.statusText}`);
          return;
        }

        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errs: Record<string, string> = {};
          errorData.errors.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              errs[err.path[0]] = err.message;
            }
          });
          setAdminErrors(errs);
        } else {
          toast.error(errorData.message || "Signup failed");
        }
        return;
      }

      // Success case
      await response.json();
      toast.success("Admin Registration Successful! Pending approval.");
      navigate("/signin");
    } catch (error: any) {
      // Handle network errors, CORS errors, etc.
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error("Cannot connect to server. Please check if the backend is running on http://localhost:5000");
      } else if (error.message?.includes("CORS")) {
        toast.error("CORS error: Please check backend CORS configuration.");
      } else {
        toast.error("Something went wrong! Please try again.");
      }
      console.error("Admin signup error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#f0f7f5]" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow">
              <img
                src={civicIssueLogo}
                alt="civicIssueLogo"
                className="w-15 h-15 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#016dd0] to-[#159e52] bg-clip-text text-transparent">
                CivicResolve
              </h1>
              <p className="text-sm text-muted-foreground">
                Building Better Communities
              </p>
            </div>
          </Link>
        </div>

        <Card className="rounded-2xl shadow-2xl bg-white border-0">
          <CardHeader>
            <CardTitle>
              <center>Create Account</center>
            </CardTitle>
            <CardDescription>
              Join our community to report issues and help build better cities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-gray-200/80 p-1">
                <TabsTrigger
                  value="citizen"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#016dd0] data-[state=active]:to-[#159e52] data-[state=active]:text-white opacity-80"
                >
                  Citizen
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#016dd0] data-[state=active]:to-[#159e52] data-[state=active]:text-white opacity-80"
                >
                  Administrator
                </TabsTrigger>
              </TabsList>

              {/* Citizen Tab Content */}
              <TabsContent value="citizen">
                <AnimatePresence mode="wait">
                  {activeTab === "citizen" && (
                    <motion.div
                      key="citizen-motion"
                      initial={{ opacity: 0, x: 32 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -32 }}
                      transition={{ duration: 0.33, ease: "easeOut" }}
                      className="mt-6"
                    >
                      <form
                        onSubmit={handleCitizenSignUp}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="citizen-fullName">Full Name</Label>
                          <Input
                            id="citizen-fullName"
                            placeholder="John Doe"
                            value={citizenForm.fullName}
                            disabled={isCitizenOtpSent}
                            onChange={(e) =>
                              setCitizenForm({
                                ...citizenForm,
                                fullName: e.target.value,
                              })
                            }
                            required
                          />
                          {citizenErrors.fullName && (
                            <p className="text-red-600 text-sm">
                              {citizenErrors.fullName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="citizen-email">Email</Label>
                          <Input
                            id="citizen-email"
                            type="email"
                            placeholder="citizen@example.com"
                            value={citizenForm.email}
                            disabled={isCitizenOtpSent}
                            onChange={(e) =>
                              setCitizenForm({
                                ...citizenForm,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                          {citizenErrors.email && (
                            <p className="text-red-600 text-sm">
                              {citizenErrors.email}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="citizen-phone">Phone Number</Label>
                          <Input
                            id="citizen-phone"
                            type="tel"
                            placeholder="0123456789"
                            value={citizenForm.phonenumber}
                            disabled={isCitizenOtpSent}
                            onChange={(e) =>
                              setCitizenForm({
                                ...citizenForm,
                                phonenumber: e.target.value,
                              })
                            }
                            required
                          />
                          {citizenErrors.phonenumber && (
                            <p className="text-red-600 text-sm">
                              {citizenErrors.phonenumber}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="citizen-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="citizen-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              value={citizenForm.password}
                              disabled={isCitizenOtpSent}
                              onChange={(e) =>
                                setCitizenForm({
                                  ...citizenForm,
                                  password: e.target.value,
                                })
                              }
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {citizenErrors.password && (
                            <p className="text-red-600 text-sm">
                              {citizenErrors.password}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="citizen-confirmPassword">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="citizen-confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              value={citizenForm.confirmPassword}
                              disabled={isCitizenOtpSent}
                              onChange={(e) =>
                                setCitizenForm({
                                  ...citizenForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="citizen-terms"
                            checked={citizenForm.agreeToTerms}
                            disabled={isCitizenOtpSent}
                            onCheckedChange={(checked) =>
                              setCitizenForm({
                                ...citizenForm,
                                agreeToTerms: checked as boolean,
                              })
                            }
                          />
                          <Label htmlFor="citizen-terms" className="text-sm">
                            I agree to the{" "}
                            <Link
                              to="/terms"
                              className="text-primary hover:underline"
                            >
                              Terms and Conditions
                            </Link>
                          </Label>
                          {citizenErrors.agreeToTerms && (
                            <p className="text-red-600 text-sm">
                              {citizenErrors.agreeToTerms}
                            </p>
                          )}
                        </div>
                        {isCitizenOtpSent && (
                          <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                            <Label htmlFor="citizen-otp">Email OTP</Label>
                            <Input
                              id="citizen-otp"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="Enter 6-digit OTP"
                              value={citizenOtp}
                              onChange={(e) =>
                                setCitizenOtp(
                                  e.target.value.replace(/\D/g, "").slice(0, 6)
                                )
                              }
                            />
                            <p className="text-sm text-muted-foreground">
                              We sent a verification code to {citizenForm.email}.
                            </p>
                          </div>
                        )}
                        {!isCitizenOtpSent ? (
                          <Button
                            type="submit"
                            disabled={isCitizenSubmitting}
                            className="w-full bg-gradient-to-r from-[#016dd0] to-[#159e52] text-white font-bold shadow-md hover:opacity-70 transition"
                          >
                            {isCitizenSubmitting
                              ? "Sending OTP..."
                              : "Send Signup OTP"}
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <Button
                              type="button"
                              disabled={isCitizenSubmitting}
                              onClick={handleCitizenOtpVerification}
                              className="w-full bg-gradient-to-r from-[#016dd0] to-[#159e52] text-white font-bold shadow-md hover:opacity-70 transition"
                            >
                              {isCitizenSubmitting
                                ? "Verifying OTP..."
                                : "Verify OTP & Create Account"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isCitizenSubmitting}
                              onClick={handleCitizenSignUp}
                              className="w-full"
                            >
                              Resend OTP
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={isCitizenSubmitting}
                              onClick={resetCitizenOtpFlow}
                              className="w-full"
                            >
                              Edit Details
                            </Button>
                          </div>
                        )}
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* Admin Tab Content */}

              <TabsContent value="admin">
                <AnimatePresence mode="wait">
                  {activeTab === "admin" && (
                    <motion.div
                      key="admin-motion"
                      initial={{ opacity: 0, x: 32 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -32 }}
                      transition={{ duration: 0.33, ease: "easeOut" }}
                      className="mt-6"
                    >
                      <form onSubmit={handleAdminSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-fullName">Full Name</Label>
                          <Input
                            id="admin-fullName"
                            placeholder="Narendra Modi"
                            value={adminForm.fullName}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                fullName: e.target.value,
                              })
                            }
                            required
                          />
                          {adminErrors.fullName && (
                            <p className="text-red-600 text-sm">
                              {adminErrors.fullName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-email">Official Email</Label>
                          <Input
                            id="admin-email"
                            type="email"
                            placeholder="admin@city.gov"
                            value={adminForm.email}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                          {adminErrors.email && (
                            <p className="text-red-600 text-sm">
                              {adminErrors.email}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-phone">Phone Number</Label>
                          <Input
                            id="admin-phone"
                            type="tel"
                            placeholder="0123456789"
                            value={adminForm.phonenumber}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                phonenumber: e.target.value,
                              })
                            }
                            required
                          />
                          {adminErrors.phonenumber && (
                            <p className="text-red-600 text-sm">
                              {adminErrors.phonenumber}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-department">Department *</Label>
                          <select
                            id="admin-department"
                            value={adminForm.department}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                department: e.target.value,
                              })
                            }
                            required
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select a department</option>
                            {DEPARTMENTS.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                          {adminErrors.department && (
                            <p className="text-red-600 text-sm">
                              {adminErrors.department}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-code">Admin Access Code</Label>
                          <Input
                            id="admin-code"
                            type="text"
                            placeholder="Contact your supervisor for the code"
                            value={adminForm.adminAccessCode}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                adminAccessCode: e.target.value,
                              })
                            }
                            required
                          />
                          {adminErrors.adminAccessCode && (
                            <p className="text-red-600 text-sm">
                              {adminErrors.adminAccessCode}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="admin-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              value={adminForm.password}
                              onChange={(e) =>
                                setAdminForm({
                                  ...adminForm,
                                  password: e.target.value,
                                })
                              }
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {adminErrors.password && (
                            <p className="text-red-600 text-sm">
                              {adminErrors.password}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-confirmPassword">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="admin-confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              value={adminForm.confirmPassword}
                              onChange={(e) =>
                                setAdminForm({
                                  ...adminForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {adminErrors.confirmPassword && (
                            <p className="text-red-600 text-sm">
                              {adminErrors.confirmPassword}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="admin-terms"
                            checked={adminForm.agreeToTerms}
                            onCheckedChange={(checked) =>
                              setAdminForm({
                                ...adminForm,
                                agreeToTerms: checked as boolean,
                              })
                            }
                          />
                          <Label htmlFor="admin-terms" className="text-sm">
                            I agree to the{" "}
                            <Link
                              to="/terms"
                              className="text-primary hover:underline"
                            >
                              Terms and Conditions
                            </Link>
                          </Label>
                          {adminErrors.agreeToTerms && (
                            <p className="text-red-600 text-sm">
                              {adminErrors.agreeToTerms}
                            </p>
                          )}
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-[#016dd0] to-[#159e52] text-white font-bold shadow-md hover:opacity-70 transition"
                        >
                          Create Admin Account
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/signin" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  ← Back to Home
                </Link>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
