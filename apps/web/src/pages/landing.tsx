import { Button } from '@anso/ui';
import { ArrowRight, Users, Kanban, Zap, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';


export function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-sm" role="banner">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="Anso - Accueil">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <svg className="h-5 w-5 text-white" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M8 22L16 10L24 22H8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-900">Anso</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Tarifs
            </a>
          </nav>
          <Link to="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-32" aria-labelledby="hero-heading">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(14,165,233,0.1),transparent)]" aria-hidden="true" />

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Simple, rapide, efficace
            </div>
            <h1 id="hero-heading" className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Le{' '}
              <span className="bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">
                CRM simple
              </span>
              {' '}pour freelances et TPE
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              5 minutes pour démarrer, zéro bullshit. Gérez vos contacts et suivez vos prospects
              sans vous perdre dans des fonctionnalités inutiles. L&apos;alternative simple à HubSpot et Pipedrive.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="group px-8" aria-label="Créer un compte gratuit pour essayer Anso">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Gratuit jusqu&apos;à 10 contacts · Sans carte bancaire
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-24" aria-labelledby="features-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="features-heading" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Fonctionnalités essentielles pour votre gestion client
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Pas de fonctionnalités superflues. Juste l&apos;essentiel pour gérer votre activité de freelance ou TPE.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={Users}
              title="Gestion des contacts simplifiée"
              description="Importez et organisez vos contacts en quelques clics. Tags personnalisés, notes détaillées et recherche instantanée pour retrouver vos clients."
            />
            <FeatureCard
              icon={Kanban}
              title="Pipeline de ventes visuel"
              description="Suivez vos opportunités commerciales avec un tableau Kanban intuitif. Glissez-déposez vos deals entre les étapes de votre cycle de vente."
            />
            <FeatureCard
              icon={Zap}
              title="Interface rapide et simple"
              description="Interface épurée, chargement instantané. Pas de temps perdu en formation, concentrez-vous sur l'essentiel : vos clients."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="pricing-heading" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tarifs simples et transparents
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              CRM gratuit pour démarrer, évoluez selon vos besoins. Sans engagement.
            </p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <PricingCard
              name="Gratuit"
              price="0"
              description="Pour démarrer et tester"
              features={[
                '10 contacts maximum',
                '1 utilisateur',
                'Pipeline illimité',
                'Support par email',
              ]}
              ctaText="Commencer gratuitement"
            />
            <PricingCard
              name="Solo"
              price="10"
              description="Pour les indépendants"
              features={[
                'Contacts illimités',
                '1 utilisateur',
                'Import/Export CSV',
                'Support prioritaire',
              ]}
              highlighted
              ctaText="Passer à Solo"
            />
            <PricingCard
              name="Team"
              price="20"
              description="Pour les petites équipes"
              features={[
                'Contacts illimités',
                "Jusqu'à 3 utilisateurs",
                'Import/Export CSV',
                'Support prioritaire',
              ]}
              ctaText="Passer à Team"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-500 py-16" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 id="cta-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Prêt à simplifier votre gestion client ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
            Rejoignez les freelances et petites équipes qui ont choisi la simplicité avec notre CRM français.
          </p>
          <div className="mt-8">
            <Link to="/login">
              <Button variant="secondary" size="lg" className="px-8" aria-label="Créer un compte Anso gratuit">
                Créer mon compte gratuit
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link to="/" className="flex items-center gap-2" aria-label="Anso - Accueil">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <svg className="h-5 w-5 text-white" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path
                    d="M8 22L16 10L24 22H8Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold text-slate-900">Anso</span>
            </Link>
            <nav className="flex gap-8 text-sm text-slate-500" aria-label="Liens légaux">
              <a href="#" className="hover:text-slate-900">Mentions légales</a>
              <a href="#" className="hover:text-slate-900">Confidentialité</a>
              <a href="#" className="hover:text-slate-900">CGV</a>
            </nav>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Anso. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps): JSX.Element {
  return (
    <div className="group rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md hover:ring-slate-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 transition-colors group-hover:bg-brand-500">
        <Icon className="h-6 w-6 text-brand-600 transition-colors group-hover:text-white" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
  ctaText,
}: PricingCardProps): JSX.Element {
  return (
    <div
      className={`relative rounded-2xl p-8 ${
        highlighted
          ? 'bg-slate-900 ring-4 ring-brand-500/20'
          : 'bg-white ring-1 ring-slate-200'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-brand-500 px-4 py-1 text-sm font-medium text-white">
            Populaire
          </span>
        </div>
      )}
      <div>
        <h3
          className={`text-lg font-semibold ${highlighted ? 'text-white' : 'text-slate-900'}`}
        >
          {name}
        </h3>
        <p className={`mt-1 text-sm ${highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>
      <div className="mt-6 flex items-baseline">
        <span
          className={`text-5xl font-bold tracking-tight ${
            highlighted ? 'text-white' : 'text-slate-900'
          }`}
        >
          {price}
        </span>
        <span className={`ml-1 text-lg ${highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
          €
        </span>
        {price !== '0' && (
          <span className={`ml-2 text-sm ${highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
            /mois
          </span>
        )}
      </div>
      <ul className="mt-8 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                highlighted ? 'text-brand-400' : 'text-brand-500'
              }`}
            />
            <span
              className={`text-sm ${highlighted ? 'text-slate-300' : 'text-slate-600'}`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <Link to="/login" className="mt-8 block">
        <Button
          variant={highlighted ? 'default' : 'outline'}
          className={`w-full ${highlighted ? 'bg-brand-500 hover:bg-brand-600' : ''}`}
        >
          {ctaText}
        </Button>
      </Link>
    </div>
  );
}
