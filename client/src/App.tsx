import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import PropertiesMap from "./pages/PropertiesMap";
import BecomeHost from "./pages/BecomeHost";
import HostDashboard from "./pages/host/HostDashboard";
import AddProperty from "./pages/host/AddProperty";
import BankAccount from "./pages/host/BankAccount";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Messages from "./pages/Messages";
import Dashboard from "./pages/Dashboard";
import Verification from "./pages/Verification";
import Profile from "./pages/Profile";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/properties"} component={Properties} />
      <Route path={"/properties-map"} component={PropertiesMap} />
      <Route path={"/properties/:id"} component={PropertyDetail} />
      <Route path={"/become-host"} component={BecomeHost} />
      <Route path={"/host/dashboard"} component={HostDashboard} />
      <Route path={"/host/properties/new"} component={AddProperty} />
      <Route path={"/host/bank-account"} component={BankAccount} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/verification"} component={Verification} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
