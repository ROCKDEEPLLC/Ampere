cat > app/search/page.tsx <<'EOF'
import { redirect } from "next/navigation";

export default function SearchPage() {
  redirect("/prototype");
}
EOF
