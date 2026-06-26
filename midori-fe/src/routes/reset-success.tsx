import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reset-success")({ component: Success });

function Success() {
  return (
    <AuthShell title="Password reset!" subtitle="Your password has been updated successfully.">
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-primary/15 grid place-items-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>
        <p className="text-sm text-muted-foreground mb-6">
          You can now sign in with your new password.
        </p>
        <Link
          to="/login"
          className="inline-block w-full px-4 py-3 rounded-xl bg-gradient-hero text-white font-semibold shadow-md hover:shadow-lg transition"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
