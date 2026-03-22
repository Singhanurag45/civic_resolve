import React, { useState } from "react";
import { Eye, EyeOff, UserCircle, ShieldCheck } from "lucide-react";
import civicIssueLogo from "../assets/civic-issue.png";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { useLoader } from "../contexts/LoaderContext";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [citizenForm, setCitizenForm] = useState({ email: "", password: "" });
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
    adminAccessCode: "",
  });
  const [activeTab, setActiveTab] = useState<"citizen" | "admin">("citizen");

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showLoader, hideLoader } = useLoader();

  // Unified logic for handling both manual and guest sign-ins
  const performLogin = async (role: "citizen" | "admin", credentials: any) => {
    showLoader();
    const minLoaderDuration = new Promise((resolve) =>
      setTimeout(resolve, 1500),
    );

    try {
      let result: boolean;
      if (role === "citizen") {
        result = await Promise.all([
          login(credentials.email, credentials.password, "citizen"),
          minLoaderDuration,
        ]).then(([res]) => res);
      } else {
        result = await Promise.all([
          login(
            credentials.email,
            credentials.password,
            "admin",
            credentials.adminAccessCode,
          ),
          minLoaderDuration,
        ]).then(([res]) => res);
      }

      if (result === true) {
        toast.success("Sign In Successful!", {
          description:
            role === "citizen" ? "Welcome back!" : "Welcome back, Admin!",
        });
        navigate(role === "citizen" ? "/citizen" : "/admin", { replace: true });
      } else {
        toast.error("Sign In Failed!", { description: "Invalid credentials" });
        hideLoader();
      }
    } catch (error) {
      console.error(error);
      toast.error("Sign In Failed!", { description: "Something went wrong" });
      hideLoader();
    }
  };

  const handleManualSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const credentials = activeTab === "citizen" ? citizenForm : adminForm;
    performLogin(activeTab, credentials);
  };

  const handleGuestSignIn = (role: "citizen" | "admin") => {
    const guestData =
      role === "citizen"
        ? { email: "guest@civicresolve.com", password: "Guestpassword@123" }
        : {
            email: "guest.admin@mcd.gov",
            password: "Rohit@123",
            adminAccessCode: "81267403",
          };

    performLogin(role, guestData);
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
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="text-left">
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
            <CardTitle className="text-center text-2xl">Sign In</CardTitle>
            <CardDescription className="text-center">
              Access your account to report issues or manage community reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as any)}
            >
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-gray-100 p-1 mb-6">
                <TabsTrigger
                  value="citizen"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#016dd0] data-[state=active]:to-[#159e52] data-[state=active]:text-white"
                >
                  Citizen
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#016dd0] data-[state=active]:to-[#159e52] data-[state=active]:text-white"
                >
                  Administrator
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={handleManualSignIn} className="space-y-4">
                    {/* Form Fields based on activeTab */}
                    <div className="space-y-4">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          value={
                            activeTab === "citizen"
                              ? citizenForm.email
                              : adminForm.email
                          }
                          onChange={(e) =>
                            activeTab === "citizen"
                              ? setCitizenForm({
                                  ...citizenForm,
                                  email: e.target.value,
                                })
                              : setAdminForm({
                                  ...adminForm,
                                  email: e.target.value,
                                })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={
                              activeTab === "citizen"
                                ? citizenForm.password
                                : adminForm.password
                            }
                            onChange={(e) =>
                              activeTab === "citizen"
                                ? setCitizenForm({
                                    ...citizenForm,
                                    password: e.target.value,
                                  })
                                : setAdminForm({
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
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {activeTab === "admin" && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <Label>Admin Access Code</Label>
                          <Input
                            value={adminForm.adminAccessCode}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                adminAccessCode: e.target.value,
                              })
                            }
                            placeholder="Enter security code"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#016dd0] to-[#159e52] text-white hover:opacity-90 transition-opacity"
                    >
                      Sign In as{" "}
                      {activeTab === "citizen" ? "Citizen" : "Administrator"}
                    </Button>

                    {/* Guest Section */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                          Demo Access
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed border-2 hover:bg-slate-50 flex items-center gap-2"
                      onClick={() => handleGuestSignIn(activeTab)}
                    >
                      {activeTab === "citizen" ? (
                        <UserCircle className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Try Guest {activeTab === "citizen" ? "Citizen" : "Admin"}{" "}
                      Mode
                    </Button>
                  </form>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-[#016dd0] font-semibold hover:underline"
                  >
                    Sign up here
                  </Link>
                </p>
                <Link
                  to="/"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
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

export default SignIn;
