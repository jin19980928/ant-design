import React, { useEffect } from 'react';

import type { ModalProps } from '..';
import Modal from '..';
import { resetWarned } from '../../_util/warning';
import mountTest from '../../../tests/shared/mountTest';
import rtlTest from '../../../tests/shared/rtlTest';
import { act, createEvent, fireEvent, render, waitFakeTimer } from '../../../tests/utils';
import ConfigProvider from '../../config-provider';

jest.mock('rc-util/lib/Portal');

const ModalTester: React.FC<ModalProps> = (props) => {
  const [open, setOpen] = React.useState(false);
  const container = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    setOpen(true);
  }, []);
  return (
    <div>
      <div ref={container} />
      <Modal {...props} open={open} getContainer={container.current!}>
        Here is content of Modal
      </Modal>
    </div>
  );
};

describe('Modal', () => {
  mountTest(Modal);
  rtlTest(Modal);

  it('support closeIcon', () => {
    render(<Modal closeIcon={<a>closeIcon</a>} open />);
    expect(document.body.querySelectorAll('.ant-modal-root')[0]).toMatchSnapshot();
  });

  it('support hide close button when setting closeIcon to null or false', () => {
    const { baseElement, rerender } = render(<Modal closeIcon={null} open />);
    expect(baseElement.querySelector('.ant-modal-close')).toBeFalsy();
    rerender(<Modal closeIcon={false} open />);
    expect(baseElement.querySelector('.ant-modal-close')).toBeFalsy();
  });

  it('support disable close button when setting disable to true', () => {
    const { baseElement } = render(<Modal open closable={{ disabled: true }} />);
    expect(baseElement.querySelector('.ant-modal-close')).toHaveAttribute('disabled');
  });

  it('render correctly', () => {
    const { asFragment } = render(<ModalTester />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });

  it('render without footer', () => {
    const { asFragment } = render(<ModalTester footer={null} />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });

  it('onCancel should be called', () => {
    const onCancel = jest.fn();
    render(<Modal open onCancel={onCancel} />);
    fireEvent.click(document.body.querySelectorAll('.ant-btn')[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it('onOk should be called', () => {
    const onOk = jest.fn();
    render(<Modal open onOk={onOk} />);
    const btns = document.body.querySelectorAll('.ant-btn');
    fireEvent.click(btns[btns.length - 1]);
    expect(onOk).toHaveBeenCalled();
  });

  it('danger type', () => {
    render(<Modal okType="danger" okText="123" open />);
    const btns = document.body.querySelectorAll('.ant-btn');
    expect(btns[btns.length - 1].classList.contains('ant-btn-dangerous')).toBeTruthy();
  });

  it('mouse position', () => {
    const Demo = () => {
      const [open, setOpen] = React.useState(false);
      const containerRef = React.useRef<HTMLDivElement>(null);
      return (
        <div ref={containerRef}>
          <div id="trigger" onClick={() => setOpen(true)}>
            click me
          </div>
          <Modal open={open} getContainer={() => containerRef.current!} />
        </div>
      );
    };
    const { container } = render(<Demo />);
    const triggerEle = container.querySelectorAll('#trigger')[0];
    const clickEvent = createEvent.click(triggerEle) as any;
    clickEvent.pageX = 100;
    clickEvent.pageY = 100;
    fireEvent(triggerEle, clickEvent);

    expect(
      (container.querySelectorAll('.ant-modal')[0] as HTMLDivElement).style.transformOrigin,
    ).toBeTruthy();
  });

  it('custom mouse position', () => {
    const Demo = () => {
      const containerRef = React.useRef<HTMLDivElement>(null);
      return (
        <div ref={containerRef}>
          <Modal
            open
            getContainer={() => containerRef.current!}
            mousePosition={{ x: 100, y: 100 }}
          />
        </div>
      );
    };
    const { container } = render(<Demo />);
    expect(
      (container.querySelectorAll('.ant-modal')[0] as HTMLDivElement).style.transformOrigin,
    ).toBe('100px 100px');
  });

  it('deprecated warning', () => {
    resetWarned();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Modal visible />);
    expect(errSpy).toHaveBeenCalledWith(
      'Warning: [antd: Modal] `visible` is deprecated. Please use `open` instead.',
    );

    expect(document.querySelector('.ant-modal')).toBeTruthy();

    errSpy.mockRestore();
  });

  it('should not render footer if null', () => {
    render(<Modal open footer={null} />);
    expect(document.querySelector('.ant-modal-footer')).toBeFalsy();
  });

  it('should render custom footer', () => {
    render(<Modal open footer={<div className="custom-footer">footer</div>} />);
    expect(document.querySelector('.custom-footer')).toBeTruthy();
  });

  it('Should custom footer function second param work', () => {
    const footerFn = jest.fn();
    render(<Modal open footer={footerFn} />);

    expect(footerFn).toHaveBeenCalled();
    expect(footerFn.mock.calls[0][0]).toBeTruthy();
    expect(footerFn.mock.calls[0][1]).toEqual({
      OkBtn: expect.any(Function),
      CancelBtn: expect.any(Function),
    });
  });

  it('Should custom footer function work', () => {
    render(
      <Modal
        open
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
            <div className="custom-footer-ele">footer-ele</div>
          </>
        )}
      />,
    );
    expect(document.querySelector('.custom-footer-ele')).toBeTruthy();
  });

  // https://github.com/ant-design/ant-design/issues/
  it('Both ways should be rendered normally on the page', () => {
    render(
      <Modal
        open
        footer={(origin, { OkBtn, CancelBtn }) => (
          <>
            <div className="first-origin">{origin}</div>
            <div className="second-props-origin">
              <OkBtn />
              <CancelBtn />
            </div>
          </>
        )}
      />,
    );
    expect(document.querySelector('.first-origin')).toMatchSnapshot();
    expect(document.querySelector('.second-props-origin')).toMatchSnapshot();
  });

  it('responsive width', () => {
    render(
      <Modal open width={{ xs: '90%', sm: '80%', md: '70%', lg: '60%', xl: '50%', xxl: '40%' }} />,
    );

    const modalEle = document.querySelector<HTMLDivElement>('.ant-modal')!;
    expect(modalEle).toHaveStyle({
      '--ant-modal-xs-width': '90%',
      '--ant-modal-sm-width': '80%',
      '--ant-modal-md-width': '70%',
      '--ant-modal-lg-width': '60%',
      '--ant-modal-xl-width': '50%',
      '--ant-modal-xxl-width': '40%',
    });
  });

  it('Should support centered prop', () => {
    render(<Modal open centered />);
    expect(document.querySelector('.ant-modal-centered')).toBeTruthy();
  });

  it('Should support centered global config', () => {
    render(
      <ConfigProvider modal={{ centered: true }}>
        <Modal open />
      </ConfigProvider>,
    );
    expect(document.querySelector('.ant-modal-centered')).toBeTruthy();
  });

  it('Should prefer centered prop over centered global config', () => {
    render(
      <ConfigProvider modal={{ centered: true }}>
        <Modal open centered={false} />
      </ConfigProvider>,
    );
    expect(document.querySelector('.ant-modal-centered')).toBeFalsy();
  });

  it('Should not close modal when confirmLoading is loading', async () => {
    jest.useFakeTimers();

    const Demo: React.FC<ModalProps> = ({ onCancel = () => {}, onOk = () => {} }) => {
      const [loading, setLoading] = React.useState<boolean>(false);
      const handleOk = (event: React.MouseEvent<HTMLButtonElement>) => {
        setLoading(true);
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            setLoading(false);
            onOk(event);
            resolve();
          }, 1000);
        });
      };

      return <Modal open confirmLoading={loading} onCancel={onCancel} onOk={handleOk} />;
    };

    const onCancel = jest.fn();
    const onOk = jest.fn();

    render(<Demo onCancel={onCancel} onOk={onOk} />);

    const okButton = document.body.querySelectorAll('.ant-btn')[1];
    fireEvent.click(okButton);
    expect(okButton).toHaveClass('ant-btn-loading');

    const closeButton = document.body.querySelectorAll('.ant-modal-close')[0];
    const modalWrap = document.body.querySelectorAll('.ant-modal-wrap')[0];

    fireEvent.click(closeButton);
    fireEvent.click(modalWrap);

    await act(async () => {
      await waitFakeTimer(500);
    });

    expect(onCancel).not.toHaveBeenCalled();

    await act(async () => {
      await waitFakeTimer(1000);
    });

    fireEvent.click(closeButton);
    fireEvent.click(modalWrap);

    expect(onCancel).toHaveBeenCalled();
    expect(onOk).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
