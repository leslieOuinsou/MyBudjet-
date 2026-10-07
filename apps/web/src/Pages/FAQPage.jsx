import React, { useState } from "react";

const FAQ_SECTIONS = [
	{
		title: "Démarrage avec MyBudget+",
		questions: [
			{
				q: "Comment créer un compte ?",
				a: "Pour créer un compte, cliquez sur le bouton 'S'inscrire' dans le coin supérieur droit. Remplissez vos informations et suivez les instructions. Vous recevrez un e-mail de vérification pour activer votre compte.",
			},
			{
				q: "Comment lier mes comptes bancaires ?",
				a: "Après vous être connecté, accédez à la section 'Paramètres' puis 'Comptes liés'. Suivez les étapes pour connecter vos banques en toute sécurité via notre partenaire d'agrégation financière.",
			},
			{
				q: "Où puis-je trouver un tutoriel rapide ?",
				a: "Un guide de démarrage rapide est disponible dans la section 'Aide' sous 'Tutoriels'. Il vous expliquera les fonctionnalités de base de l'application.",
			},
		],
	},
	{
		title: "Gestion du compte et des informations personnelles",
		questions: [],
	},
	{
		title: "Facturation et paiements",
		questions: [],
	},
	{
		title: "Transactions récurrentes et budget",
		questions: [],
	},
];

export default function FAQPage() {
	const [search, setSearch] = useState("");
	const [openSection, setOpenSection] = useState(0);

	return (
		<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col">
			<div className="flex flex-1">
				{/* Sidebar */}
				<aside className="w-64 bg-white dark:bg-[#1E293B] border-r border-[#E2E8F0] dark:border-[#334155] py-8 px-6 flex flex-col gap-6">
					<nav className="flex-1">
						<ul className="space-y-2">
							<li>
								<span className="text-[#0F172A] dark:text-[#F8FAFC] text-sm">
									Rappels de factures
								</span>
							</li>
							<li>
								<span className="text-[#0F172A] dark:text-[#F8FAFC] text-sm">
									Transactions récurrentes
								</span>
							</li>
							<li className="mt-6 text-xs text-[#64748B] dark:text-[#94A3B8] font-bold">
								ADMIN
							</li>
							<li>
								<span className="text-[#0F172A] dark:text-[#F8FAFC] text-sm">
									Tableau de bord d'administration
								</span>
							</li>
							<li className="mt-6 text-xs text-[#64748B] dark:text-[#94A3B8] font-bold">
								SUPPORT
							</li>
							<li>
								<span className="text-[#0F172A] dark:text-[#F8FAFC] text-sm">
									Support/Contact
								</span>
							</li>
							<li>
								<span className="font-semibold text-[#2563EB] dark:text-[#BFDBFE] text-sm bg-[#DBEAFE] dark:bg-[#1E40AF] rounded px-2 py-1">
									Aide/FAQ
								</span>
							</li>
						</ul>
					</nav>
					<button className="mt-auto bg-[#F87171] hover:bg-[#DC2626] text-white font-semibold px-5 py-2 rounded-lg shadow transition flex items-center gap-2">
						<span className="text-lg">⇦</span> Déconnexion
					</button>
				</aside>
				{/* Main */}
				<main className="flex-1 px-12 py-10 flex flex-col">
					<h1 className="text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mb-8">
						Aide et FAQ
					</h1>
					<input
						type="text"
						placeholder="🔍 Rechercher des questions..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="mb-6 border border-[#E2E8F0] dark:border-[#334155] rounded-lg px-4 py-2 bg-[#F8FAFC] dark:bg-[#334155]/50 focus:border-[#2563EB] w-full max-w-xl"
					/>
					<div className="flex flex-col gap-3">
						{FAQ_SECTIONS.map((section, idx) => (
							<div
								key={section.title}
								className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl"
							>
								<button
									className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/50 transition font-semibold text-[#0F172A] dark:text-[#F8FAFC] text-base"
									onClick={() =>
										setOpenSection(
											openSection === idx ? null : idx
										)
									}
								>
									<span className="min-w-0 flex-1 pr-2">{section.title}</span>
									<span
										className={`ml-2 text-2xl transition-transform ${
											openSection === idx
												? "rotate-180"
												: "rotate-0"
										}`}
									>
										⌄
									</span>
								</button>
								{openSection === idx && (
									<div className="px-6 pb-4">
										{section.questions.length === 0 &&
											idx !== 0 && (
												<span className="text-[#64748B] dark:text-[#94A3B8]">
													Aucune question dans cette section.
												</span>
											)}
										{section.questions.length > 0 &&
											section.questions.map((q, qidx) => (
												<div key={q.q} className="mb-4">
													<div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
														{q.q}
													</div>
													<div className="text-[#64748B] dark:text-[#94A3B8]">
														{q.a}
													</div>
												</div>
											))}
										{idx === 0 &&
											section.questions.map((q, qidx) => (
												<div key={q.q} className="mb-4">
													<div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
														{q.q}
													</div>
													<div className="text-[#64748B] dark:text-[#94A3B8]">
														{q.a}
													</div>
												</div>
											))}
									</div>
								)}
							</div>
						))}
					</div>
				</main>
			</div>
		</div>
	);
}
