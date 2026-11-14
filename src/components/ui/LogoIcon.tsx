// Logo Dinthialma : le lièvre à la pièce (desing/export).
// variant "color" : fonds clairs ; "white" : fonds verts (version mode sombre).

interface LogoIconProps {
  size?: number
  className?: string
  variant?: 'color' | 'white'
}

export function LogoIcon({ size = 32, className, variant = 'color' }: LogoIconProps) {
  return (
    <img
      src={variant === 'white' ? '/icons/logo-lievre-blanc.png' : '/icons/logo-lievre.png'}
      width={size}
      height={size}
      alt="Dinthialma"
      draggable={false}
      className={className}
    />
  )
}
