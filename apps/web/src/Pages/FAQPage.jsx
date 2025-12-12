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
		<div className="min-h-screen bg-[#F5F7FA] flex flex-col">
			<div className="flex flex-1">
				{/* Sidebar */}
				<aside className="w-64 bg-white border-r border-[#EAF4FB] py-8 px-6 flex flex-col gap-6">
					<nav className="flex-1">
						<ul className="space-y-2">
							<li>
								<span className="text-[#343A40] text-sm">
									Rappels de factures
								</span>
							</li>
							<li>
								<span className="text-[#343A40] text-sm">
									Transactions récurrentes
								</span>
							</li>
							<li className="mt-6 text-xs text-[#6C757D] font-bold">
								ADMIN
							</li>
							<li>
								<span className="text-[#343A40] text-sm">
									Tableau de bord d'administration
								</span>
							</li>
							<li className="mt-6 text-xs text-[#6C757D] font-bold">
								SUPPORT
							</li>
							<li>
								<span className="text-[#343A40] text-sm">
									Support/Contact
								</span>
							</li>
							<li>
								<span className="font-semibold text-[#1E73BE] text-sm bg-[#EAF4FB] rounded px-2 py-1">
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
					<h1 className="text-3xl font-extrabold text-[#22292F] mb-8">
						Aide et FAQ
					</h1>
					<input
						type="text"
						placeholder="🔍 Rechercher des questions..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="mb-6 border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE] w-full max-w-xl"
					/>
					<div className="flex flex-col gap-3">
						{FAQ_SECTIONS.map((section, idx) => (
							<div
								key={section.title}
								className="bg-white border border-[#EAF4FB] rounded-xl"
							>
								<button
									className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none hover:bg-[#F5F7FA] transition font-semibold text-[#22292F] text-base"
									onClick={() =>
										setOpenSection(
											openSection === idx ? null : idx
										)
									}
								>
									<span>{section.title}</span>
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
												<span className="text-[#6C757D]">
													Aucune question dans cette section.
												</span>
											)}
										{section.questions.length > 0 &&
											section.questions.map((q, qidx) => (
												<div key={q.q} className="mb-4">
													<div className="font-bold text-[#22292F] mb-1">
														{q.q}
													</div>
													<div className="text-[#6C757D]">
														{q.a}
													</div>
												</div>
											))}
										{idx === 0 &&
											section.questions.map((q, qidx) => (
												<div key={q.q} className="mb-4">
													<div className="font-bold text-[#22292F] mb-1">
														{q.q}
													</div>
													<div className="text-[#6C757D]">
														{q.a}
													</div>
												</div>
											))}
									</div>
								)}
							</div>
						))}
					</div>
					<footer className="flex flex-col md:flex-row items-center justify-between gap-2 mt-8 text-[#6C757D] text-sm">
						<div className="flex gap-6">
							<span>Ressources</span>
							<span>Mentions légales</span>
							<span>Communauté</span>
						</div>
						<div className="flex gap-4 text-xl">
							<span className="hover:text-[#1E73BE] cursor-pointer">
								{String.fromCharCode(0xf09a)}
							</span>
							<span className="hover:text-[#1E73BE] cursor-pointer">
								{String.fromCharCode(0xf099)}
							</span>
							<span className="hover:text-[#1E73BE] cursor-pointer">
								{String.fromCharCode(0xf0e1)}
							</span>
							<span className="hover:text-[#1E73BE] cursor-pointer">
								{String.fromCharCode(0xf16d)}
							</span>
						</div>
					</footer>
				</main>
			</div>
		</div>
	);
}
