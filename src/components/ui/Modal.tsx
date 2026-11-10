import { Dialog, Transition } from '@headlessui/react'
import { Fragment, ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Modale responsive :
 * - Mobile : « bottom sheet » qui monte du bas (geste naturel, pouce)
 * - Desktop : boîte centrée classique
 */
export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const sizeStyles = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={`w-full ${sizeStyles[size]} transform bg-white shadow-xl transition-all rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh]`}
              >
                {/* Poignée mobile */}
                <div className="sm:hidden pt-2.5 flex justify-center">
                  <span className="h-1.5 w-10 rounded-full bg-neutral-200" />
                </div>

                <div className="flex items-center justify-between px-5 pt-3 pb-3 sm:pt-5">
                  <Dialog.Title className="text-lg font-bold text-neutral-900">{title}</Dialog.Title>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
                    aria-label="Fermer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-5 pb-5 overflow-y-auto flex-1">{children}</div>

                {footer && (
                  <div className="border-t border-neutral-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
